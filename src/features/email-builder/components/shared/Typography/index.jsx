import React, { memo } from 'react';
import PropTypes from 'prop-types';

const typographyVariants = {
  heading: {
    classes: 'text-2xl font-bold'
  },
  heading1: {
    classes: 'text-heading-1'
  },
  heading2: {
    classes: 'text-heading-2'
  },
  heading3: {
    classes: 'text-heading-3'
  },
  heading4: {
    classes: 'text-heading-4'
  },
  heading5: {
    classes: 'text-heading-5'
  },
  title1: {
    classes: 'text-title-1'
  },
  title2: {
    classes: 'text-title-2'
  },
  content1: {
    classes: 'text-content-1'
  },
  content2: {
    classes: 'text-content-2'
  },
  content3: {
    classes: 'text-content-3'
  },
  body1: {
    classes: 'text-content-1'
  }
};

export const Typography = memo(({ variant, text, textHtml, className }) => {
  const variantStyles = typographyVariants[variant] || { classes: '' }; // Fallback for invalid variants
  const combinedClassName = `${variantStyles.classes} ${className}`.trim();

  if (textHtml)
    return <p className={combinedClassName} dangerouslySetInnerHTML={{ __html: textHtml }} />;
  return <p className={combinedClassName}>{text}</p>;
});

Typography.propTypes = {
  variant: PropTypes.oneOf([
    'heading',
    'heading1',
    'heading2',
    'heading3',
    'heading4',
    'heading5',
    'title1',
    'title2',
    'content1',
    'content2',
    'content3',
    'body1'
  ]),
  text: PropTypes.node,
  textHtml: PropTypes.node,
  className: PropTypes.string,
};

Typography.defaultProps = {
  variant: 'heading',
  text: '',
  className: '',
  textHtml: ''
};
