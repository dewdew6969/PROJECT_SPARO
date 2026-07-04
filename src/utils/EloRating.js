/**
 * Fungsi kalkulasi ELO Rating berdasarkan ERP Vibe SPARO
 * 
 * Formula: Rnew = Rold + K(S-E)
 * Expected Score: E = 1 / (1 + 10^((OpponentRating - PlayerRating)/400))
 * 
 * K Factor Rules:
 * - Placement Match = 40
 * - Regular Player = 32
 * - Experienced Player = 24
 * - Elite Player = 16
 */

// Menentukan K-Factor berdasarkan status pemain atau rating saat ini
export const getKFactor = (isPlacementMatch, currentRating) => {
    if (isPlacementMatch) return 40;
    if (currentRating >= 2000) return 16; // Elite Player (misal rating > 2000)
    if (currentRating >= 1500) return 24; // Experienced Player
    return 32; // Regular Player
};

// Menghitung Expected Score (E)
export const getExpectedScore = (playerRating, opponentRating) => {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
};

/**
 * Menghitung Rating ELO baru setelah pertandingan
 * 
 * @param {number} playerRating Rating awal pemain
 * @param {number} opponentRating Rating lawan
 * @param {number} actualScore Hasil match (1 untuk Menang, 0.5 untuk Seri, 0 untuk Kalah)
 * @param {boolean} isPlacementMatch Apakah ini 5 match penempatan pertama?
 * @returns {number} Rating baru pemain yang dibulatkan
 */
export const calculateNewRating = (playerRating, opponentRating, actualScore, isPlacementMatch = false) => {
    const K = getKFactor(isPlacementMatch, playerRating);
    const E = getExpectedScore(playerRating, opponentRating);
    
    // Formula: Rnew = Rold + K * (S - E)
    const newRating = playerRating + K * (actualScore - E);
    
    // Kembalikan hasil yang dibulatkan ke bilangan bulat terdekat
    return Math.round(newRating);
};

/* 
  Contoh Penggunaan:
  const p1Rating = 1000; // Player 1 (Beginner)
  const p2Rating = 1050; // Player 2

  // Player 1 MENANG (Score = 1) di pertandingan reguler:
  const p1New = calculateNewRating(p1Rating, p2Rating, 1, false);
  
  // Player 1 KALAH (Score = 0):
  const p1NewLoss = calculateNewRating(p1Rating, p2Rating, 0, false);
*/
