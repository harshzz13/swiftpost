import { Router } from 'express';
import { StatisticsService } from '../services/StatisticsService';
import { APIResponse } from '../types';

const router = Router();
const statisticsService = StatisticsService.getInstance();

// Get general queue statistics
router.get('/', async (req, res): Promise<void> => {
  try {
    const stats = await statisticsService.getQueueStatistics();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Get statistics by service type
router.get('/services', async (req, res): Promise<void> => {
  try {
    const serviceStats = await statisticsService.getServiceStatistics();

    res.json({
      success: true,
      data: serviceStats,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    console.error('Error fetching service statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service statistics',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Get hourly statistics
router.get('/hourly', async (req, res): Promise<void> => {
  try {
    const hourlyStats = await statisticsService.getHourlyStatistics();

    res.json({
      success: true,
      data: hourlyStats,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    console.error('Error fetching hourly statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hourly statistics',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Get counter utilization
router.get('/counters', async (req, res): Promise<void> => {
  try {
    const utilization = await statisticsService.getCounterUtilization();

    res.json({
      success: true,
      data: utilization,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    console.error('Error fetching counter utilization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch counter utilization',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

// Get queue summary
router.get('/queue', async (req, res): Promise<void> => {
  try {
    const queueSummary = await statisticsService.getQueueSummary();

    res.json({
      success: true,
      data: queueSummary,
      timestamp: new Date().toISOString()
    } as APIResponse);

  } catch (error) {
    console.error('Error fetching queue summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch queue summary',
      timestamp: new Date().toISOString()
    } as APIResponse);
  }
});

export default router;