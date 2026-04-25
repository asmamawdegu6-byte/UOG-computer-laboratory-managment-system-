const fs = require('fs');
const path = 'backend/controllers/reportController.js';

let content = fs.readFileSync(path, 'utf8');

// Find the broken part and truncate before it
const brokenMarker = 'const upcomingMaintenance = await Equipment.find({';
const idx = content.lastIndexOf(brokenMarker);
if (idx !== -1) {
  const before = content.substring(0, idx);
  const lastNewline = before.lastIndexOf('\n');
  content = before.substring(0, lastNewline);
}

const tail = `
        const upcomingMaintenance = await Equipment.find({
            isActive: true,
            nextMaintenanceDate: { $gte: today, $lte: thirtyDaysLater }
        })
            .populate('lab', 'name code')
            .sort({ nextMaintenanceDate: 1 });

        const overdueMaintenance = await Equipment.find({
            isActive: true,
            nextMaintenanceDate: { $lt: today }
        })
            .populate('lab', 'name code')
            .sort({ nextMaintenanceDate: 1 });

        const thisWeek = [];
        const thisMonth = [];

        upcomingMaintenance.forEach(eq => {
            const daysUntil = Math.ceil((new Date(eq.nextMaintenanceDate) - today) / (1000 * 60 * 60 * 24));
            if (daysUntil <= 7) {
                thisWeek.push({ ...eq.toObject(), daysUntil });
            } else {
                thisMonth.push({ ...eq.toObject(), daysUntil });
            }
        });

        res.json({
            success: true,
            reminders: {
                overdue: overdueMaintenance.map(eq => ({
                    ...eq.toObject(),
                    daysOverdue: Math.ceil((today - new Date(eq.nextMaintenanceDate)) / (1000 * 60 * 60 * 24))
                })),
                thisWeek,
                thisMonth,
                summary: {
                    overdueCount: overdueMaintenance.length,
                    thisWeekCount: thisWeek.length,
                    thisMonthCount: thisMonth.length
                }
            }
        });
    } catch (error) {
        console.error('Maintenance reminders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.sendMaintenanceReminders = async (req, res) => {
    try {
        const today = new Date();
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(today.getDate() + 7);

        const upcomingMaintenance = await Equipment.find({
            isActive: true,
            nextMaintenanceDate: { $gte: today, $lte: sevenDaysLater }
        }).populate('lab', 'name');

        const overdueEquipment = await Equipment.find({
            isActive: true,
            nextMaintenanceDate: { $lt: today }
        }).populate('lab', 'name');

        const notifications = [];

        for (const eq of upcomingMaintenance) {
            const daysUntil = Math.ceil((new Date(eq.nextMaintenanceDate) - today) / (1000 * 60 * 60 * 24));
            await notifyByRole(['technician', 'admin'], {
                sender: req.user._id,
                type: 'maintenance_reminder',
                title: 'Maintenance Reminder',
                message: '"' + eq.name + '" in ' + (eq.lab?.name || 'Unknown Lab') + ' needs maintenance in ' + daysUntil + ' day(s)',
                link: '/technician/equipment',
                priority: daysUntil <= 2 ? 'high' : 'medium',
                relatedModel: 'Equipment',
                relatedId: eq._id
            });
            notifications.push({ equipment: eq.name, daysUntil, status: 'upcoming' });
        }

        for (const eq of overdueEquipment) {
            const daysOverdue = Math.ceil((today - new Date(eq.nextMaintenanceDate)) / (1000 * 60 * 60 * 24));
            await notifyByRole(['technician', 'admin'], {
                sender: req.user._id,
                type: 'maintenance_overdue',
                title: 'Overdue Maintenance',
                message: '"' + eq.name + '" in ' + (eq.lab?.name || 'Unknown Lab') + ' maintenance is ' + daysOverdue + ' day(s) overdue!',
                link: '/technician/equipment',
                priority: 'critical',
                relatedModel: 'Equipment',
                relatedId: eq._id
            });
            notifications.push({ equipment: eq.name, daysOverdue, status: 'overdue' });
        }

        res.json({
            success: true,
            message: 'Sent ' + notifications.length + ' maintenance reminder(s)',
            notifications
        });
    } catch (error) {
        console.error('Send maintenance reminders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
`;

fs.writeFileSync(path, content + tail);
console.log('File fixed successfully.');
