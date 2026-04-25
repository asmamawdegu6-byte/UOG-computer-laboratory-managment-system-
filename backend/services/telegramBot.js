const TelegramBot = require('node-telegram-bot-api');
const Fault = require('../models/Fault');
const Lab = require('../models/Lab');
const User = require('../models/User');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

let bot = null;
let botUserId = null;
const conversations = new Map();

// Category buttons
const categories = [
  { id: 'hardware', label: '🔧 Hardware Issue' },
  { id: 'software', label: '💻 Software Issue' },
  { id: 'network', label: '🌐 Network Issue' },
  { id: 'peripheral', label: '🖱️ Peripheral Issue' },
  { id: 'other', label: '📋 Others' }
];

// Severity options
const severities = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'critical', label: 'Critical' }
];

// Helper: create inline keyboard
function createInlineKeyboard(buttons, columns = 1) {
  const keyboard = [];
  for (let i = 0; i < buttons.length; i += columns) {
    const row = buttons.slice(i, i + columns).map(btn => ({
      text: btn.label,
      callback_data: `${buttons === categories ? 'cat_' : 'sev_'}${btn.id}`
    }));
    keyboard.push(row);
  }
  return keyboard;
}

// Ensure a dedicated bot user exists in the system
async function ensureBotUser() {
  try {
    const existingBotUser = await User.findOne({ username: 'telegram_bot' });
    if (existingBotUser) {
      botUserId = existingBotUser._id;
      console.log('[Bot] Bot user found:', existingBotUser.username, 'ID:', botUserId);
      return;
    }

    const botUser = await User.create({
      username: 'telegram_bot',
      email: 'telegram_bot@clm.edu',
      password: 'TelegramBot123!',
      firstName: 'Telegram',
      lastName: 'Bot',
      name: 'Telegram Bot',
      role: 'student',
      isActive: true,
      approvalStatus: 'approved'
    });
    botUserId = botUser._id;
    console.log('[Bot] Created bot user. ID:', botUserId);
  } catch (error) {
    console.error('[Bot] Error ensuring bot user:', error);
    throw error;
  }
}

// Submit fault to database
async function submitFault(chatId, conv) {
  try {
    console.log('[Bot] submitFault conv:', {
      labId: conv.labId,
      labIdType: typeof conv.labId,
      title: conv.title,
      category: conv.category,
      severity: conv.severity
    });

    if (!conv.labId || !conv.title || !conv.description || !conv.category || !conv.severity) {
      throw new Error('Missing required fields');
    }

    // Ensure labId is an ObjectId
    let labObjectId = conv.labId;
    if (typeof conv.labId === 'string') {
      labObjectId = mongoose.Types.ObjectId(conv.labId);
    }

    const faultData = {
      reportedBy: botUserId,
      lab: labObjectId,
      workstation: conv.workstation || undefined,
      category: conv.category,
      severity: conv.severity,
      title: conv.title,
      description: conv.description,
      submittedTo: 'technician'
    };

    const fault = new Fault(faultData);
    await fault.save();
    console.log('[Bot] Fault saved to DB:', {
      _id: fault._id,
      title: fault.title,
      category: fault.category,
      lab: fault.lab,
      reportedBy: fault.reportedBy,
      status: fault.status
    });

    // Verify it's actually in DB
    const check = await Fault.findById(fault._id);
    if (!check) {
      throw new Error('Fault not found after save - possible DB issue');
    }
    console.log('[Bot] Verified fault exists in DB:', check._id);

    await fault.populate('reportedBy lab');
    console.log('[Bot] Fault populated:', {
      reportedBy: fault.reportedBy?.name,
      lab: fault.lab?.name
    });

    // Cleanup conversation
    conversations.delete(chatId);

    const successMsg = `✅ *Fault Reported Successfully!*\n\n` +
      `*Fault ID:* ${fault._id}\n` +
      `*Title:* ${fault.title}\n` +
      `*Status:* ${fault.status}\n\n` +
      `Our technical team will address your issue shortly.`;

    await bot.sendMessage(chatId, successMsg, { parse_mode: 'Markdown' });

  } catch (error) {
    console.error('[Bot] Error submitting fault:', error);
    await bot.sendMessage(chatId, '❌ Failed to submit fault report. Please try again later.');
    conversations.delete(chatId);
  }
}

// Setup all bot event handlers
function setupHandlers(bot) {
  // /start command handler
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'there';

    conversations.delete(chatId);

    const welcomeMessage = `👋 Hello ${userName}! Welcome to the Lab Support Bot.\n\nPlease select the type of issue you're reporting:`;

    const keyboard = {
      inline_keyboard: createInlineKeyboard(categories, 2)
    };

    bot.sendMessage(chatId, welcomeMessage, { reply_markup: keyboard })
      .then(() => {
        conversations.set(chatId, { step: 'AWAITING_CATEGORY' });
      })
      .catch(err => console.error('[Bot] Error sending start message:', err));
  });

  // /cancel command handler
  bot.onText(/\/cancel/, (msg) => {
    const chatId = msg.chat.id;
    if (conversations.has(chatId)) {
      conversations.delete(chatId);
      bot.sendMessage(chatId, '✅ Fault report cancelled. Send /start to begin again.');
    } else {
      bot.sendMessage(chatId, 'No active report. Send /start to begin.');
    }
  });

  // Callback query handler
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const conv = conversations.get(chatId);

    await bot.answerCallbackQuery(query.id);

    if (!conv) {
      bot.sendMessage(chatId, 'Session expired. Send /start to begin again.');
      return;
    }

    // Category selection
    if (data.startsWith('cat_')) {
      const category = data.replace('cat_', '');
      conv.category = category;
      conv.step = 'AWAITING_LAB';

      const categoryNames = {
        hardware: 'Hardware Issue',
        software: 'Software Issue',
        network: 'Network Issue',
        peripheral: 'Peripheral Issue',
        other: 'Other Issue'
      };

      await bot.sendMessage(chatId, `You selected: *${categoryNames[category]}*`, { parse_mode: 'Markdown' });
      await bot.sendMessage(chatId, '📍 Please enter the *lab name* or *lab code* (e.g., LAB-A101, IT Lab):', { parse_mode: 'Markdown' });
      return;
    }

    // Severity selection
    if (data.startsWith('sev_')) {
      const severity = data.replace('sev_', '');
      conv.severity = severity;
      conv.step = 'AWAITING_CONFIRM';

      const summary = `📋 *Fault Report Summary*\n\n` +
        `*Category:* ${conv.category}\n` +
        `*Lab:* ${conv.labName}\n` +
        `*Workstation:* ${conv.workstation || 'N/A'}\n` +
        `*Title:* ${conv.title}\n` +
        `*Description:* ${conv.description}\n` +
        `*Severity:* ${severity.charAt(0).toUpperCase() + severity.slice(1)}\n\n` +
        `Do you want to submit this report?`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '✅ Yes, Submit', callback_data: 'confirm_yes' }],
          [{ text: '❌ No, Cancel', callback_data: 'confirm_no' }]
        ]
      };

      await bot.sendMessage(chatId, summary, { parse_mode: 'Markdown', reply_markup: keyboard });
      return;
    }

    // Confirmation
    if (data === 'confirm_yes') {
      await submitFault(chatId, conv);
      return;
    }

    if (data === 'confirm_no') {
      conversations.delete(chatId);
      await bot.sendMessage(chatId, '🚫 Fault report cancelled. Send /start to begin again.');
      return;
    }
  });

  // Text message handler
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : '';

    if (!text || !conversations.has(chatId)) {
      if (text && !conversations.has(chatId)) {
        console.log(`[Bot] Received message from ${chatId} but no active conversation: "${text.substring(0, 50)}"`);
      }
      return;
    }

    const conv = conversations.get(chatId);
    console.log(`[Bot] Chat ${chatId} step=${conv.step}, text="${text.substring(0, 50)}"`);

    try {
      switch (conv.step) {
        case 'AWAITING_LAB':
          console.log(`[Bot] Chat ${chatId} searching for lab: "${text}"`);
          const labRegex = new RegExp(text, 'i');
          const labs = await Lab.find({
            $or: [{ name: labRegex }, { code: labRegex }],
            isActive: true
          }).limit(5);

          console.log(`[Bot] Found ${labs.length} labs matching "${text}"`, labs.map(l => ({ id: l._id, name: l.name, code: l.code })));

          if (labs.length === 0) {
            await bot.sendMessage(chatId, '❌ No lab found matching that name/code. Please try again.\nEnter lab name or code:');
            return;
          }

          if (labs.length === 1) {
            conv.labId = labs[0]._id;
            conv.labName = labs[0].name;
            conv.step = 'AWAITING_WORKSTATION';
            await bot.sendMessage(chatId, `✅ Lab found: *${labs[0].name}* (${labs[0].code})`, { parse_mode: 'Markdown' });
            await bot.sendMessage(chatId, '🖥️ Please enter the *Workstation ID* (e.g., PC-05), or send /skip to skip.', { parse_mode: 'Markdown' });
          } else {
            conv.step = 'AWAITING_LAB_CHOICE';
            conv.matchingLabs = labs;
            const labList = labs.map((l, i) => `${i + 1}. ${l.name} (${l.code})`).join('\n');
            await bot.sendMessage(chatId, `🔍 Multiple labs found:\n\n${labList}\n\nPlease reply with the number of the correct lab (1-${labs.length}):`);
          }
          break;

        case 'AWAITING_LAB_CHOICE':
          const choice = parseInt(text, 10);
          if (isNaN(choice) || choice < 1 || choice > conv.matchingLabs.length) {
            await bot.sendMessage(chatId, 'Invalid choice. Please enter a valid number from the list.');
            return;
          }
          const selectedLab = conv.matchingLabs[choice - 1];
          console.log(`[Bot] Chat ${chatId} selected lab #${choice}: ${selectedLab.name} (${selectedLab.code})`);
          conv.labId = selectedLab._id;
          conv.labName = selectedLab.name;
          conv.step = 'AWAITING_WORKSTATION';
          await bot.sendMessage(chatId, `✅ Lab selected: *${selectedLab.name}* (${selectedLab.code})`, { parse_mode: 'Markdown' });
          await bot.sendMessage(chatId, '🖥️ Please enter the *Workstation ID* (e.g., PC-05), or send /skip to skip.', { parse_mode: 'Markdown' });
          break;

        case 'AWAITING_WORKSTATION':
          if (text.toLowerCase() === '/skip') {
            conv.workstation = '';
          } else {
            conv.workstation = text;
          }
          conv.step = 'AWAITING_TITLE';
          await bot.sendMessage(chatId, '📝 Please enter a *brief title* for the issue (e.g., "Computer #5 not booting"):', { parse_mode: 'Markdown' });
          break;

        case 'AWAITING_TITLE':
          if (text.length < 5) {
            await bot.sendMessage(chatId, 'Title too short. Please provide at least 5 characters.');
            return;
          }
          conv.title = text;
          conv.step = 'AWAITING_DESCRIPTION';
          await bot.sendMessage(chatId, '📄 Please provide a *detailed description* of the issue:');
          break;

        case 'AWAITING_DESCRIPTION':
          if (text.length < 10) {
            await bot.sendMessage(chatId, 'Description too short. Please provide more details (at least 10 characters).');
            return;
          }
          conv.description = text;
          conv.step = 'AWAITING_SEVERITY';
          const severityKeyboard = {
            inline_keyboard: createInlineKeyboard(severities, 2)
          };
          await bot.sendMessage(chatId, '🔔 Select the *severity level* of this issue:', {
            parse_mode: 'Markdown',
            reply_markup: severityKeyboard
          });
          break;

        default:
          await bot.sendMessage(chatId, 'Unexpected input. Send /cancel to start over.');
      }
    } catch (err) {
      console.error('[Bot] Error processing message:', err);
      await bot.sendMessage(chatId, 'An error occurred. Please try again or send /start to restart.');
    }
  });

  bot.on('polling_error', (error) => {
    console.error('[Bot] Polling error:', error);
  });
}

// Export initialize function
module.exports.initializeBot = async () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[Bot] TELEGRAM_BOT_TOKEN not set in .env. Telegram bot will not start.');
    return;
  }

  try {
    await ensureBotUser();
    bot = new TelegramBot(token, { polling: true });
    setupHandlers(bot);
    console.log('🤖 Telegram Bot started with category buttons!');
    console.log('Bot user ID:', botUserId);
  } catch (err) {
    console.error('[Bot] Failed to initialize:', err);
  }
};
