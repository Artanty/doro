import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import { dd } from '../utils/dd';

const KEY_BACK_URL = process.env.KEY_BACK_URL;

/**
 * req.headers['authorization'] - Bearer ${api key fromm key@back.get-token}
 * req.headers['x-requester-project']; fe tik@back
 * req.headers['x-requester-url']; fe http://localhost:3202 (tik@back url)
 * */
export async function validateApiKey(req: Request, res: Response, next: NextFunction) {
  dd('validateApiKey START');

  // req.headers['authorization'] changed to X-Api-Key 
  // todo change everywhere . v2!

  // Quick validation with early returns
  const apiKeyHeader = req.headers['x-api-key'];
  if (!apiKeyHeader) {
    dd('Missing x-api-key header');
    return res.status(401).json({ error: 'x-api-key header required' });
  }

  const requesterProject = req.headers['x-requester-project'];
  const requesterUrl = req.headers['x-requester-url'];

  dd('Params: ')
  dd('apiKeyHeader: ' + (apiKeyHeader ? '****' + apiKeyHeader.slice(-4) : 'MISSING'))
  dd('requesterProject: ' + (requesterProject || 'MISSING')) 
  dd('requesterUrl: ' + (requesterUrl || 'MISSING'))

  if (!requesterProject || !requesterUrl) {
    dd('Missing required parameters');
    return res.status(400).json({ 
      error: 'Missing parameters',
      requires: ['x-api-key', 'x-requester-project', 'x-requester-url']
    });
  }

  try {
    const response = await axios.post(`${KEY_BACK_URL}/validate`, {
      requesterProject,
      requesterApiKey: apiKeyHeader,
      requesterUrl
    }, {
      headers: {
        'X-Project-Id': process.env.PROJECT_ID,
        'X-Project-Domain-Name': `${req.protocol}://${req.get('host')}`,
        'X-Api-Key': process.env.BASE_KEY
      }
    });

    if (!response.data.valid) {
      dd('Invalid token response');
      return res.status(403).json({ error: 'Invalid token' });
    }

    dd('validateApiKey END - Valid');
    next();
  } catch (error: any) {
    console.error('Validation faile d:', error.message);
    res.status(500).json({ error: 'Token validation failed' });
  }
}