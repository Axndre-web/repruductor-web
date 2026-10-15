/**
 * server/arcade-router.js
 * Registrador de transacciones recreativas en el Ledger Unificado de Neon Orb
 */

const express = require('express');
const router = express.Router();

router.post('/api/arcade/slot/spin', (req, res) => {
    const { bet, user } = req.body;
    
    // Registro auditado de la jugada
    console.log(`[ARCADE LEDGER] Apuesta procesada: ${bet} EUR por usuario ${user || 'Local'}`);
    
    res.json({
        status: 'ACCEPTED',
        timestamp: new Date().toISOString(),
        transactionId: 'TX-SLOT-' + Date.now()
    });
});

module.exports = router;