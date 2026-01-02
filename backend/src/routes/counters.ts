import { Router } from 'express';
import { CounterService } from '../services/CounterService';
import { APIResponse, CounterStatus } from '../types';
import { getSocketInstance } from '../lib/socket';

const router = Router();
const counterService = CounterService.getInstance();

// Get all counters
router.get('/', async (req, res): Promise<void> => {
  try {
    const counters = await counterService.getAllCounters();

    res.json({
      success: true,
      data: counters,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    console.error('Error fetching counters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch counters',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Create a new counter
router.post('/', async (req, res): Promise<void> => {
  try {
    const { number } = req.body;

    if (!number || isNaN(parseInt(number))) {
      res.status(400).json({
        success: false,
        error: 'Valid counter number is required',
        timestamp: new Date().toISOString()
      } as APIResponse);
      return;
    }

    const counter = await counterService.addCounter(parseInt(number));

    // Emit real-time update
    const io = getSocketInstance();
    io.emit('counterAdded', counter);

    res.status(201).json({
      success: true,
      data: counter,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    console.error('Error creating counter:', error);
    
    let errorMessage = 'Failed to create counter';
    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      } as APIResponse);
      return;
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Update counter status
router.patch('/:id/status', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Valid status (ACTIVE or INACTIVE) is required',
        timestamp: new Date().toISOString()
      } as APIResponse);
      return;
    }

    const counter = await counterService.updateCounterStatus(parseInt(id), status as CounterStatus);

    // Emit real-time update
    const io = getSocketInstance();
    io.emit('counterStatusChanged', counter);

    res.json({
      success: true,
      data: counter,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    console.error('Error updating counter:', error);
    
    let errorMessage = 'Failed to update counter';
    let statusCode = 500;
    
    if (error instanceof Error && error.message.includes('active tokens')) {
      errorMessage = error.message;
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Delete counter
router.delete('/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;

    await counterService.deleteCounter(parseInt(id));

    // Emit real-time update
    const io = getSocketInstance();
    io.emit('counterDeleted', { id: parseInt(id) });

    res.json({
      success: true,
      data: { message: 'Counter deleted successfully' },
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    console.error('Error deleting counter:', error);
    
    let errorMessage = 'Failed to delete counter';
    let statusCode = 500;
    
    if (error instanceof Error && error.message.includes('active tokens')) {
      errorMessage = error.message;
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

export default router;