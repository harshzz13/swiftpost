import { Router } from 'express';
import { prisma } from '../lib/database';
import { QueueManager } from '../services/QueueManager';
import { APIResponse, ServiceType, TokenRequest, TokenResponse, TokenWithDetails } from '../types';
import { getSocketInstance } from '../lib/socket';

const router = Router();
const queueManager = QueueManager.getInstance();

// Generate a new token
router.post('/', async (req, res): Promise<void> => {
  try {
    const { serviceType }: TokenRequest = req.body;

    if (!serviceType) {
      res.status(400).json({
        success: false,
        error: 'Service type is required',
        timestamp: new Date().toISOString()
      } as APIResponse);
      return;
    }

    // Validate service type
    const validServiceTypes: ServiceType[] = [
      'Parcel Drop-off',
      'Banking Services', 
      'General Inquiry',
      'Document Verification'
    ];

    if (!validServiceTypes.includes(serviceType)) {
      res.status(400).json({
        success: false,
        error: 'Invalid service type',
        timestamp: new Date().toISOString()
      } as APIResponse);
      return;
    }

    // Generate token using QueueManager
    const tokenDetails = await queueManager.generateToken(serviceType);

    const response: TokenResponse = {
      tokenNumber: tokenDetails.tokenNumber,
      queuePosition: tokenDetails.queuePosition,
      estimatedWaitTime: tokenDetails.estimatedWaitTime,
      serviceType: tokenDetails.serviceType
    };

    // Emit real-time update
    const io = getSocketInstance();
    io.emit('tokenGenerated', {
      token: response,
      queueUpdate: await getQueueStats()
    });

    res.status(201).json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    } as APIResponse<TokenResponse>);

  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate token',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Get token status
router.get('/:tokenNumber', async (req, res): Promise<void> => {
  try {
    const { tokenNumber } = req.params;

    const tokenDetails = await queueManager.getTokenDetails(tokenNumber);

    if (!tokenDetails) {
      res.status(404).json({
        success: false,
        error: 'Token not found',
        timestamp: new Date().toISOString()
      } as APIResponse);
      return;
    }

    res.json({
      success: true,
      data: tokenDetails,
      timestamp: new Date().toISOString()
    } as APIResponse<TokenWithDetails>);

  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Get all waiting tokens (for staff interface)
router.get('/queue/waiting', async (req, res): Promise<void> => {
  try {
    const waitingTokens = await prisma.token.findMany({
      where: { status: 'WAITING' },
      orderBy: { createdAt: 'asc' },
      take: 20
    });

    const formattedTokens = await Promise.all(
      waitingTokens.map(async (token) => {
        const details = await queueManager.getTokenDetails(token.tokenNumber);
        return details;
      })
    );

    res.json({
      success: true,
      data: formattedTokens.filter(token => token !== null),
      timestamp: new Date().toISOString()
    } as APIResponse<TokenWithDetails[]>);

  } catch (error) {
    console.error('Error fetching waiting tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch waiting tokens',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Call next token (for staff)
router.post('/call-next', async (req, res): Promise<void> => {
  try {
    const { counterId } = req.body;

    if (!counterId) {
      res.status(400).json({
        success: false,
        error: 'Counter ID is required',
        timestamp: new Date().toISOString()
      } as APIResponse);
      return;
    }

    // Get the next waiting token
    const nextToken = await queueManager.getNextToken();

    if (!nextToken) {
      res.status(404).json({
        success: false,
        error: 'No tokens in queue',
        timestamp: new Date().toISOString()
      } as APIResponse);
      return;
    }

    // Assign token to counter
    const updatedToken = await queueManager.assignTokenToCounter(nextToken.tokenNumber, parseInt(counterId));

    // Emit real-time update
    const io = getSocketInstance();
    io.emit('tokenCalled', {
      token: updatedToken,
      queueUpdate: await getQueueStats()
    });

    res.json({
      success: true,
      data: updatedToken,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    console.error('Error calling next token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to call next token',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Complete token service
router.post('/:tokenNumber/complete', async (req, res): Promise<void> => {
  try {
    const { tokenNumber } = req.params;

    const updatedToken = await queueManager.completeToken(tokenNumber);

    // Emit real-time update
    const io = getSocketInstance();
    io.emit('tokenCompleted', {
      token: updatedToken,
      queueUpdate: await getQueueStats()
    });

    res.json({
      success: true,
      data: updatedToken,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    console.error('Error completing token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete token',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Helper function to get queue statistics
async function getQueueStats() {
  const { StatisticsService } = await import('../services/StatisticsService');
  const statsService = StatisticsService.getInstance();
  return await statsService.getQueueStatistics();
}

export default router;