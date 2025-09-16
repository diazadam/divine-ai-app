import { Router } from 'express';
import { realtimeService } from '../services/openai-realtime';
import { mcpService } from '../services/mcp-connectors';
import { theologicalAI } from '../services/theological-ai';

const router = Router();

// Realtime Prayer Session endpoints
router.post('/api/prayer/session/start', async (req, res) => {
  try {
    const { userId, preferences } = req.body;
    const sessionId = await realtimeService.createPrayerSession(userId, preferences);
    res.json({ sessionId, status: 'active' });
  } catch (error) {
    console.error('Error starting prayer session:', error);
    res.status(500).json({ error: 'Failed to start prayer session' });
  }
});

router.post('/api/prayer/session/:sessionId/audio', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const audioData = req.body.audio; // Base64 encoded audio
    realtimeService.sendAudio(sessionId, Buffer.from(audioData, 'base64'));
    res.json({ status: 'received' });
  } catch (error) {
    console.error('Error sending audio:', error);
    res.status(500).json({ error: 'Failed to send audio' });
  }
});

router.post('/api/prayer/session/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    realtimeService.endSession(sessionId);
    res.json({ status: 'ended' });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Bible Study Session
router.post('/api/bible-study/session/start', async (req, res) => {
  try {
    const { userId, passage } = req.body;
    const sessionId = await realtimeService.createBibleStudySession(userId, passage);
    res.json({ sessionId, status: 'active' });
  } catch (error) {
    console.error('Error starting Bible study:', error);
    res.status(500).json({ error: 'Failed to start Bible study session' });
  }
});

// MCP Connector endpoints
router.post('/api/mcp/calendar/sync', async (req, res) => {
  try {
    const { accessToken, query } = req.body;
    const events = await mcpService.syncChurchEvents(accessToken, query);
    res.json({ events });
  } catch (error) {
    console.error('Error syncing calendar:', error);
    res.status(500).json({ error: 'Failed to sync calendar' });
  }
});

router.post('/api/mcp/devotional/send', async (req, res) => {
  try {
    const { accessToken, recipients, devotional } = req.body;
    const result = await mcpService.sendDevotional(accessToken, recipients, devotional);
    res.json({ status: 'sent', result });
  } catch (error) {
    console.error('Error sending devotional:', error);
    res.status(500).json({ error: 'Failed to send devotional' });
  }
});

router.post('/api/mcp/sermon/materials', async (req, res) => {
  try {
    const { accessToken, topic } = req.body;
    const materials = await mcpService.getSermonMaterials(accessToken, topic);
    res.json({ materials });
  } catch (error) {
    console.error('Error getting sermon materials:', error);
    res.status(500).json({ error: 'Failed to get sermon materials' });
  }
});

router.post('/api/mcp/youtube/analyze', async (req, res) => {
  try {
    const { videoUrl } = req.body;
    const analysis = await mcpService.analyzeSermonVideo(videoUrl);
    res.json({ analysis });
  } catch (error) {
    console.error('Error analyzing video:', error);
    res.status(500).json({ error: 'Failed to analyze video' });
  }
});

// Theological AI endpoints
router.post('/api/theology/analyze', async (req, res) => {
  try {
    const query = req.body;
    const analysis = await theologicalAI.analyzeTheology(query);
    res.json({ analysis });
  } catch (error) {
    console.error('Error in theological analysis:', error);
    res.status(500).json({ error: 'Failed to analyze theology' });
  }
});

router.post('/api/counseling/session', async (req, res) => {
  try {
    const session = req.body;
    const counseling = await theologicalAI.provideCounseling(session);
    res.json({ counseling });
  } catch (error) {
    console.error('Error in counseling:', error);
    res.status(500).json({ error: 'Failed to provide counseling' });
  }
});

router.post('/api/worship/create', async (req, res) => {
  try {
    const { theme, duration, style } = req.body;
    const experience = await theologicalAI.createWorshipExperience(theme, duration, style);
    res.json({ experience });
  } catch (error) {
    console.error('Error creating worship experience:', error);
    res.status(500).json({ error: 'Failed to create worship experience' });
  }
});

router.post('/api/sermon/prepare', async (req, res) => {
  try {
    const { topic, scripture, length } = req.body;
    const sermon = await theologicalAI.prepareSermon(topic, scripture, length);
    res.json({ sermon });
  } catch (error) {
    console.error('Error preparing sermon:', error);
    res.status(500).json({ error: 'Failed to prepare sermon' });
  }
});

router.post('/api/theology/compare', async (req, res) => {
  try {
    const { doctrine } = req.body;
    const comparison = await theologicalAI.compareDenominations(doctrine);
    res.json({ comparison });
  } catch (error) {
    console.error('Error comparing denominations:', error);
    res.status(500).json({ error: 'Failed to compare denominations' });
  }
});

router.post('/api/bible/language', async (req, res) => {
  try {
    const { verse, word } = req.body;
    const analysis = await theologicalAI.analyzeOriginalLanguage(verse, word);
    res.json({ analysis });
  } catch (error) {
    console.error('Error analyzing language:', error);
    res.status(500).json({ error: 'Failed to analyze original language' });
  }
});

// Note: WebSocket endpoint would be handled separately with express-ws
// For now, the Realtime API sessions are managed through regular HTTP endpoints
// with the actual WebSocket connection to OpenAI handled server-side

export default router;