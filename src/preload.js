if (localStorage.getItem('first_run') !== false) {
  const alertText = 
  `PLEASE READ THE TEXT BELOW BEFORE CLOSING THIS WINDOW!!

  A deezer login page will open. Login to your account, then it will redirecting to Deezer. The window is not closable due to a bug that makes the RPC not working at all.

  The web player will automatically update the current song, so don't worry the RPC it will update by itself.`;

  alert(alertText);

  localStorage.setItem('first_run', false);
}