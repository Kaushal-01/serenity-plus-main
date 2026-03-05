/**
 * Clear Serenity Player LocalStorage
 * 
 * If you're experiencing QuotaExceededError, run this in your browser console:
 * 
 * localStorage.removeItem('serenity-player-state');
 * location.reload();
 * 
 * Or paste this entire script into the console to see stats and clear:
 */

(function() {
  const key = 'serenity-player-state';
  const savedState = localStorage.getItem(key);
  
  if (!savedState) {
    console.log('✓ No player state found in localStorage');
    return;
  }
  
  const sizeInBytes = new Blob([savedState]).size;
  const sizeInKB = (sizeInBytes / 1024).toFixed(2);
  const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);
  
  console.log('=== Serenity Player Storage Info ===');
  console.log(`Size: ${sizeInKB} KB (${sizeInMB} MB)`);
  
  if (sizeInBytes > 500000) {
    console.warn('⚠️  Player state is unusually large (over 500KB)');
  }
  
  try {
    const state = JSON.parse(savedState);
    console.log(`Songs in queue: ${state.queueData?.length || 0}`);
    console.log(`Current song: ${state.song?.name || state.song?.songName || 'Unknown'}`);
    
    // Check for large data
    const stateStr = JSON.stringify(state);
    if (stateStr.includes('data:audio/')) {
      console.warn('⚠️  Contains base64 audio data (should not be stored)');
    }
    if (state.queueData?.some(s => s.audioFile)) {
      console.warn('⚠️  Contains audioFile base64 data (should not be stored)');
    }
  } catch (e) {
    console.error('❌ Failed to parse player state (corrupted)');
  }
  
  console.log('\nTo clear player state, run:');
  console.log('localStorage.removeItem("serenity-player-state"); location.reload();');
})();
