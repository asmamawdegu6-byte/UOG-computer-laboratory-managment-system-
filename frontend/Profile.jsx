import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import './Profile.css';

const Profile = () => {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    // Clean up the preview URL to avoid memory leaks when component unmounts or preview changes
    useEffect(() => {
        return () => {
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveInterestPhoto = async () => {
        if (!image) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('photo', image);
        formData.append('type', 'interest');

        try {
            await api.post('/user/profile/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Interest photo updated successfully!');
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Failed to upload photo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="profile-settings">
                <h1>Profile Settings</h1>
                <Card title="Interest Photo">
                    <div className="interest-photo-picker">
                        <div
                            className="photo-preview"
                            onClick={() => document.getElementById('interest-photo-input').click()}
                            title="Click to select or change image"
                        >
                            {preview ? (
                                <img src={preview} alt="Interest preview" />
                            ) : (
                                <div className="placeholder">Pick an image for your interests</div>
                            )}
                        </div>

                        <div className="actions">
                            <input
                                type="file"
                                id="interest-photo-input"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            <Button
                                variant="secondary"
                                onClick={() => document.getElementById('interest-photo-input').click()}
                            >
                                Select Image
                            </Button>

                            <Button
                                variant="primary"
                                onClick={handleSaveInterestPhoto}
                                disabled={!image || loading}
                            >
                                {loading ? 'Saving...' : 'Save Photo'}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default Profile;