"use client";
import React, { useState } from 'react';
import WelcomeHeader from './WelcomeHeader';
import WelcomeForm from './WelcomeForm';
import { Paper } from '@mui/material';

const WelcomeList: React.FC = () => {
  return (
    <div className="p-4 sm:p-6">
      <WelcomeHeader />      
          <WelcomeForm  />
    </div>
  );
};
export default WelcomeList;

