import React, { useState } from 'react';
import './CareerTimeline.css';

interface CareerTimelineProps {
  onClose?: () => void;
}

interface CareerPosition {
  year: string;
  title: string;
  company: string;
  description: string;
  icon: string; // Material icon name
  color: string;
  position: 'top' | 'bottom'; // Whether to display above or below the timeline
  details?: string; // Additional details for the modal
  achievements?: string[];
}

const CareerTimeline: React.FC<CareerTimelineProps> = () => {
  const [selectedPosition, setSelectedPosition] = useState<CareerPosition | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Sample career data - replace with your actual career history
  const careerPositions: CareerPosition[] = [
    {
      year: '2010',
      title: 'ONLINE COURSE MARKETING CONSULTANT',
      company: 'Online Marketing GmbH',
      description: 'A full year course stimulating creative marketing.',
      icon: 'school',
      color: '#FF5A5A', // Red
      position: 'top',
      details: 'Completed a comprehensive marketing course focused on digital strategies and campaign optimization.',
      achievements: [
        'Developed marketing strategies for 5+ product launches',
        'Increased conversion rates by 25% through A/B testing',
        'Created content marketing plan that boosted engagement by 40%'
      ]
    },
    {
      year: '2012',
      title: 'OPERATIONAL OFFICER',
      company: 'Game Marketing GmbH',
      description: 'Optimizing landing page development of the UX through A/B testing and data-driven decision making.',
      icon: 'trending_up',
      color: '#2CD9C5', // Teal
      position: 'bottom',
      details: 'Led operational improvements across marketing campaigns and user experience optimization.',
      achievements: [
        'Redesigned landing pages resulting in 30% higher conversion',
        'Implemented data-driven UX improvements across the platform',
        'Managed a team of 3 designers and 2 developers'
      ]
    },
    {
      year: '2014',
      title: 'GOOGLE ADWORDS SPECIALIST',
      company: 'Full audit / setup to become a Google Adwords expert',
      description: 'Mastered Google Ads platform through intensive training and certification.',
      icon: 'ads_click',
      color: '#FFC043', // Yellow/Orange
      position: 'top',
      details: 'Obtained Google Ads certification and implemented successful campaigns for multiple clients.',
      achievements: [
        'Achieved Google Ads certification with 95% score',
        'Optimized campaigns reducing CPA by 35%',
        'Managed monthly ad spend of €50,000 with positive ROI'
      ]
    },
    {
      year: '2018',
      title: 'COUNTRY MANAGER',
      company: 'Sailor Travel Co.',
      description: 'Managing and implementing the travel office increasing productivity, marketing, sales and engagement and recruitment.',
      icon: 'public',
      color: '#4D7CFE', // Blue
      position: 'bottom',
      details: 'Oversaw all operations for the country division, focusing on growth and team development.',
      achievements: [
        'Increased regional sales by 45% within first year',
        'Built a team of 12 travel specialists from ground up',
        'Launched 3 new travel product lines that exceeded targets by 20%'
      ]
    },
    {
      year: '2020',
      title: 'DIGITAL MARKETING DIRECTOR',
      company: 'Tech Solutions Inc.',
      description: 'Led digital transformation initiatives and managed multi-channel marketing campaigns.',
      icon: 'devices',
      color: '#A259FF', // Purple
      position: 'top',
      details: 'Directed the company\'s digital marketing strategy during a critical growth phase.',
      achievements: [
        'Increased online presence resulting in 65% growth in digital leads',
        'Launched successful social media campaign reaching 2M+ users',
        'Implemented marketing automation reducing campaign launch time by 40%'
      ]
    },
    {
      year: '2022',
      title: 'HEAD OF MARKETING',
      company: 'Big Marketing LTD',
      description: 'Building the marketing organization and managing the brand image and marketing for 7 verticals.',
      icon: 'business',
      color: '#43CCFF', // Light Blue
      position: 'bottom',
      details: 'Led comprehensive marketing strategies across multiple business verticals with focus on digital transformation.',
      achievements: [
        'Directed rebranding initiative that increased brand recognition by 60%',
        'Implemented cross-channel marketing strategy increasing lead generation by 75%',
        'Reduced marketing costs by 25% while improving campaign performance'
      ]
    }
  ];

  const openModal = (position: CareerPosition) => {
    setSelectedPosition(position);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedPosition(null), 300); // Clear after animation
  };

  return (
    <div className="career-timeline-container">
      <div className="modern-timeline">
        {/* Career positions along the timeline */}
        {careerPositions.map((position, index) => (
          <div key={index} className="timeline-section">
            {/* Year box */}
            <div 
              className="year-box"
              style={{ backgroundColor: position.color }}
              onClick={() => openModal(position)}
              aria-label={`View details for ${position.title} at ${position.company}`}
            >
              {position.year}
            </div>
            
            {/* Position info - alternating above/below */}
            <div 
              className={`position-info ${index % 2 === 0 ? 'above' : 'below'}`}
              onClick={() => openModal(position)}
              style={{ cursor: 'pointer' }}
            >
              <div className="position-icon" style={{ backgroundColor: position.color }}>
                <span className="material-icons">{position.icon}</span>
              </div>
              <div className="position-content">
                <h3>{position.title}</h3>
                <h4>{position.company}</h4>
              </div>
            </div>
          </div>
        ))}

      </div>

      {/* Modal for detailed view */}
      {showModal && selectedPosition && (
        <div className="career-modal-overlay" onClick={closeModal}>
          <div className="career-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-button" onClick={closeModal}>
              <span className="material-icons">close</span>
            </button>
            
            <div className="modal-header" style={{ backgroundColor: selectedPosition.color }}>
              <div className="modal-icon">
                <span className="material-icons">{selectedPosition.icon}</span>
              </div>
              <div className="modal-title-section">
                <h2>{selectedPosition.title}</h2>
                <h3>{selectedPosition.company}</h3>
                <div className="modal-year">{selectedPosition.year}</div>
              </div>
            </div>
            
            <div className="modal-content">
              <p className="modal-description">{selectedPosition.description}</p>
              
              {selectedPosition.details && (
                <div className="modal-details">
                  <p>{selectedPosition.details}</p>
                </div>
              )}
              
              {selectedPosition.achievements && selectedPosition.achievements.length > 0 && (
                <div className="modal-achievements">
                  <h4>Key Achievements</h4>
                  <ul>
                    {selectedPosition.achievements.map((achievement, i) => (
                      <li key={i}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerTimeline;
