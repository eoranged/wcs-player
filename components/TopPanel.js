import React from 'react';
import TelegramUser from './TelegramUser';
import styles from '../styles/TopPanel.module.css';

const TopPanel = () => {
  return (
    <div className={styles.topPanel}>
      <div className={styles.userContainer}>
        <TelegramUser />
      </div>
    </div>
  );
};

export default TopPanel;
