import React, { createContext, useContext, useState, useEffect } from 'react';

const CampusContext = createContext(null);

// Campus images - Real computer lab themed images for each campus
const campusImages = {
    MAR: {
        hero: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1920&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&q=80',
            'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
            'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80'
        ],
        icon: '💻',
        labImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80',
        studentsImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&q=80',
        equipmentImage: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=600&q=80'
    },
    ATF: {
        hero: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1920&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
            'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
            'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80'
        ],
        icon: '🖥️',
        labImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80',
        studentsImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80',
        equipmentImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80'
    },
    ATW: {
        hero: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1920&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
            'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&q=80',
            'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80'
        ],
        icon: '🎓',
        labImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80',
        studentsImage: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80',
        equipmentImage: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=600&q=80'
    },
    HSC: {
        hero: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&q=80',
        thumbnail: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80',
        gallery: [
            'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',
            'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80',
            'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80'
        ],
        icon: '🏥',
        labImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80',
        studentsImage: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&q=80',
        equipmentImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&q=80'
    }
};

// Default campuses (matching backend seed data)
export const defaultCampuses = [
    {
        _id: 'campus-1',
        name: 'Maraki',
        code: 'MAR',
        description: 'Main campus of University of Gondar',
        city: 'Gondar',
        isActive: true,
        image: campusImages.MAR
    },
    {
        _id: 'campus-2',
        name: 'Atse Tewodros',
        code: 'ATW',
        description: 'Atse Tewodros campus of University of Gondar',
        city: 'Gondar',
        isActive: true,
        image: campusImages.ATW
    },
    {
        _id: 'campus-3',
        name: 'Atse Fasil',
        code: 'ATF',
        description: 'Atse Fasil campus of University of Gondar',
        city: 'Gondar',
        isActive: true,
        image: campusImages.ATF
    },
    {
        _id: 'campus-4',
        name: 'Health Science College (GC)',
        code: 'HSC',
        description: 'Health Science College campus of University of Gondar',
        city: 'Gondar',
        isActive: true,
        image: campusImages.HSC
    }
];

export const getCampusImage = (campusCode) => {
    return campusImages[campusCode] || campusImages.MAR;
};

export const CampusProvider = ({ children }) => {
    const [selectedCampus, setSelectedCampus] = useState(null);
    const [campuses, setCampuses] = useState(defaultCampuses);
    const [loading, setLoading] = useState(false);

    // Load campus from localStorage on mount
    useEffect(() => {
        const savedCampus = localStorage.getItem('selectedCampus');
        if (savedCampus) {
            try {
                setSelectedCampus(JSON.parse(savedCampus));
            } catch (e) {
                console.error('Error parsing saved campus:', e);
            }
        }
    }, []);

    // Save campus to localStorage when selected
    const selectCampus = (campus) => {
        setSelectedCampus(campus);
        if (campus) {
            localStorage.setItem('selectedCampus', JSON.stringify(campus));
        } else {
            localStorage.removeItem('selectedCampus');
        }
    };

    const clearCampus = () => {
        setSelectedCampus(null);
        localStorage.removeItem('selectedCampus');
    };

    const getCampusByCode = (code) => {
        return campuses.find(c => c.code.toLowerCase() === code.toLowerCase());
    };

    const value = {
        selectedCampus,
        selectCampus,
        clearCampus,
        campuses,
        setCampuses,
        loading,
        getCampusByCode,
        getCampusImage
    };

    return (
        <CampusContext.Provider value={value}>
            {children}
        </CampusContext.Provider>
    );
};

export const useCampus = () => {
    const context = useContext(CampusContext);
    if (!context) {
        throw new Error('useCampus must be used within a CampusProvider');
    }
    return context;
};

export default CampusContext;