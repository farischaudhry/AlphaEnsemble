import React from 'react';
import styles from '../styles/Header.module.css';

function Header() {
  return (
    <header className={styles.header}>
      <h1>AlphaEnsemble</h1>
      {/* <div className={styles.filters}> */}
        {/* Add filters for leaderboard? */}
      {/* </div> */}
    </header>
  );
}

export default Header;
