import React from 'react';
import './Card.css';

const Card = ({ 
  children, 
  title,
  subtitle,
  header,
  footer,
  className = '',
  ...props 
}) => {
  return (
    <div className={`card ${className}`} {...props}>
      {(header || title) && (
        <div className="card-header">
          {header || (
            <>
              {title && <h3 className="card-title">{title}</h3>}
              {subtitle && <p className="card-subtitle">{subtitle}</p>}
            </>
          )}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;