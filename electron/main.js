const { app, BrowserWindow, Menu, shell, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const sqlite3 = require('sqlite3').verbose();
const whisperCppService = require('./services/whisperCppService');
const llamaCppService = require('./services/llamaCppService');
const isDev = process.env.IS_DEV === 'true';

let mainWindow;
let db;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 700,
    height: 900,
    minWidth: 700,
    minHeight: 900,
    maxWidth: 1400,
    maxHeight: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    titleBarStyle: 'hiddenInset', // macOS style
    show: false, // Don't show until ready
    icon: path.join(__dirname, '../build/icon.png')
  });

  // Set Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src 'self' https://fonts.gstatic.com; " +
          "img-src 'self' data: blob:; " +
          "connect-src 'self' ws: wss:;"
        ]
      }
    });
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', async () => {
    mainWindow = null;
    if (db) {
      db.close();
    }
    // Shutdown AI services
    try {
      await whisperCppService.shutdown();
      await llamaCppService.shutdown();
    } catch (error) {
      console.error('Error shutting down AI services:', error);
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Database migration function
async function runMigrations() {
  return new Promise((resolve, reject) => {
    // Check existing columns in meetings table
    db.all("PRAGMA table_info(meetings)", (err, columns) => {
      if (err) {
        reject(err);
        return;
      }
      
      const columnNames = columns.map(col => col.name);
      const missingColumns = [];
      
      // Check for missing columns
      if (!columnNames.includes('status')) {
        missingColumns.push("ALTER TABLE meetings ADD COLUMN status TEXT DEFAULT 'ready'");
      }
      if (!columnNames.includes('description')) {
        missingColumns.push("ALTER TABLE meetings ADD COLUMN description TEXT");
      }
      if (!columnNames.includes('actual_start_time')) {
        missingColumns.push("ALTER TABLE meetings ADD COLUMN actual_start_time DATETIME");
      }
      if (!columnNames.includes('notes')) {
        missingColumns.push("ALTER TABLE meetings ADD COLUMN notes TEXT");
      }
      if (!columnNames.includes('summary')) {
        missingColumns.push("ALTER TABLE meetings ADD COLUMN summary TEXT");
      }
      if (!columnNames.includes('summary_generated_at')) {
        missingColumns.push("ALTER TABLE meetings ADD COLUMN summary_generated_at DATETIME");
      }
      if (!columnNames.includes('transcription_status')) {
        missingColumns.push("ALTER TABLE meetings ADD COLUMN transcription_status TEXT DEFAULT 'pending'");
      }
      if (!columnNames.includes('has_transcription')) {
        missingColumns.push("ALTER TABLE meetings ADD COLUMN has_transcription BOOLEAN DEFAULT 0");
      }
      
      if (missingColumns.length === 0) {
        console.log('Database schema is up to date');
        resolve();
        return;
      }
      
      console.log(`Adding ${missingColumns.length} missing columns to meetings table...`);
      
      // Execute all migration queries
      let completed = 0;
      const total = missingColumns.length;
      
      missingColumns.forEach((sql, index) => {
        db.run(sql, (alterErr) => {
          if (alterErr) {
            console.error(`Failed to execute migration ${index + 1}:`, alterErr);
            reject(alterErr);
            return;
          }
          
          completed++;
          console.log(`Migration ${completed}/${total} completed`);
          
          if (completed === total) {
            console.log('All migrations completed successfully');
            resolve();
          }
        });
      });
    });
  });
}

// Database initialization
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    try {
      const dbPath = path.join(app.getPath('userData'), 'meeting-helper.db');
      db = new sqlite3.Database(dbPath, async (err) => {
        if (err) {
          console.error('Failed to open database:', err);
          reject(err);
          return;
        }
        
        try {
          // Enable foreign keys
          db.run('PRAGMA foreign_keys = ON');
          db.run('PRAGMA journal_mode = WAL');
          
          // Run migrations - use the correct path for development vs production
          let schemaPath;
          if (isDev) {
            // In development, use the dist-electron path where Vite builds
            schemaPath = path.join(__dirname, '..', 'electron', 'database', 'schema.sql');
          } else {
            // In production, look in the app resources
            schemaPath = path.join(process.resourcesPath, 'app', 'electron', 'database', 'schema.sql');
          }
          
          const schema = await fs.readFile(schemaPath, 'utf8');
          
          db.exec(schema, async (err) => {
            if (err) {
              console.error('Failed to execute schema:', err);
              reject(err);
            } else {
              console.log('Database initialized successfully');
              
              // Run migrations for existing databases
              try {
                await runMigrations();
                resolve(true);
              } catch (migrationError) {
                console.error('Migration failed:', migrationError);
                reject(migrationError);
              }
            }
          });
        } catch (error) {
          console.error('Failed to read schema:', error);
          reject(error);
        }
      });
    } catch (error) {
      console.error('Failed to initialize database:', error);
      reject(error);
    }
  });
}

// Helper function to promisify database operations
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// IPC Handlers
function setupIpcHandlers() {
  // Path utilities
  ipcMain.handle('get-user-data-path', () => {
    return app.getPath('userData');
  });

  ipcMain.handle('get-app-path', () => {
    return app.getAppPath();
  });

  // Database initialization
  ipcMain.handle('initializeDatabase', async () => {
    if (db) {
      return true; // Already initialized
    }
    return await initializeDatabase();
  });

  // Meeting operations
  ipcMain.handle('createMeeting', async (event, meetingData) => {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const result = await dbRun(`
      INSERT INTO meetings (title, platform, start_time, participant_count)
      VALUES (?, ?, ?, ?)
    `, [
      meetingData.title,
      meetingData.platform,
      meetingData.startTime,
      meetingData.participantCount || null
    ]);
    
    return result.lastID;
  });

  ipcMain.handle('getMeeting', async (event, id) => {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    return await dbGet('SELECT * FROM meetings WHERE id = ?', [id]);
  });

  ipcMain.handle('getAllMeetings', async (event, limit = 50, offset = 0) => {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    return await dbAll(`
      SELECT * FROM meetings 
      ORDER BY start_time DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);
  });

  ipcMain.handle('updateMeeting', async (event, id, updates) => {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(updates), id];
    return await dbRun(`
      UPDATE meetings 
      SET ${setClause}
      WHERE id = ?
    `, values);
  });

  ipcMain.handle('deleteMeeting', async (event, id) => {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    return await dbRun('DELETE FROM meetings WHERE id = ?', [id]);
  });

  ipcMain.handle('endMeeting', async (event, id, endTime, duration) => {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    return await dbRun(`
      UPDATE meetings 
      SET end_time = ?, duration = ?
      WHERE id = ?
    `, [endTime, duration, id]);
  });

  // Transcript operations
  ipcMain.handle('addTranscript', async (event, transcriptData) => {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    return await dbRun(`
      INSERT INTO transcripts (meeting_id, speaker_id, text, start_time, end_time, confidence)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      transcriptData.meetingId,
      transcriptData.speakerId,
      transcriptData.text,
      transcriptData.startTime,
      transcriptData.endTime,
      transcriptData.confidence
    ]);
  });

  ipcMain.handle('getTranscripts', async (event, meetingId) => {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    return await dbAll(`
      SELECT * FROM transcripts 
      WHERE meeting_id = ? 
      ORDER BY start_time ASC
    `, [meetingId]);
  });

  ipcMain.handle('searchTranscripts', async (event, query, meetingId = null) => {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    let sql = `
      SELECT t.*, m.title as meeting_title, m.start_time as meeting_start
      FROM transcripts t
      JOIN meetings m ON t.meeting_id = m.id
      WHERE t.text LIKE ?
    `;
    
    const params = [`%${query}%`];
    
    if (meetingId) {
      sql += ' AND t.meeting_id = ?';
      params.push(meetingId);
    }
    
    sql += ' ORDER BY t.start_time ASC';
    
    return await dbAll(sql, params);
  });

  // Speaker operations
  ipcMain.handle('addOrUpdateSpeaker', async (event, speakerData) => {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    return await dbRun(`
      INSERT INTO speakers (id, meeting_id, display_name, total_speaking_time)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id, meeting_id) DO UPDATE SET
        display_name = COALESCE(excluded.display_name, display_name),
        total_speaking_time = excluded.total_speaking_time
    `, [
      speakerData.id,
      speakerData.meetingId,
      speakerData.displayName,
      speakerData.totalSpeakingTime || 0
    ]);
  });

  ipcMain.handle('getSpeakers', async (event, meetingId) => {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    return await dbAll(`
      SELECT * FROM speakers 
      WHERE meeting_id = ? 
      ORDER BY total_speaking_time DESC
    `, [meetingId]);
  });

  ipcMain.handle('updateSpeakerName', async (event, speakerId, meetingId, displayName) => {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    return await dbRun(`
      UPDATE speakers 
      SET display_name = ? 
      WHERE id = ? AND meeting_id = ?
    `, [displayName, speakerId, meetingId]);
  });

  // Settings operations
  ipcMain.handle('getSetting', async (event, key) => {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const result = await dbGet('SELECT value FROM settings WHERE key = ?', [key]);
    return result ? result.value : null;
  });

  ipcMain.handle('setSetting', async (event, key, value) => {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    return await dbRun(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `, [key, value]);
  });

  // Analytics and statistics
  ipcMain.handle('getMeetingStats', async (event) => {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    return await dbGet(`
      SELECT 
        COUNT(*) as total_meetings,
        SUM(duration) as total_duration,
        AVG(duration) as avg_duration,
        COUNT(CASE WHEN platform = 'zoom' THEN 1 END) as zoom_meetings,
        COUNT(CASE WHEN platform = 'teams' THEN 1 END) as teams_meetings,
        COUNT(CASE WHEN platform = 'meet' THEN 1 END) as meet_meetings
      FROM meetings
      WHERE end_time IS NOT NULL
    `);
  });

  // Database maintenance
  ipcMain.handle('vacuum', async (event) => {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    return await dbRun('VACUUM');
  });

  // Utility function to save transcript segments and speakers
  async function saveTranscriptSegments(segments, meetingId) {
    if (!segments || segments.length === 0) {
      return { success: true };
    }
    
    for (const segment of segments) {
      console.log('Saving segment:', segment);
      
      // Add transcript segment
      await dbRun(`
        INSERT INTO transcripts (meeting_id, speaker_id, text, start_time, end_time, confidence)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        meetingId,
        segment.speaker || 'speaker_0',
        segment.text,
        segment.start,
        segment.end,
        segment.confidence || 0.0
      ]);
      
      // Add or update speaker
      await dbRun(`
        INSERT OR REPLACE INTO speakers (id, meeting_id, display_name, total_speaking_time)
        VALUES (?, ?, ?, COALESCE((SELECT total_speaking_time FROM speakers WHERE id = ? AND meeting_id = ?), 0) + ?)
      `, [
        segment.speaker || 'speaker_0',
        meetingId,
        segment.speaker || 'speaker_0',
        segment.speaker || 'speaker_0',
        meetingId,
        segment.end - segment.start
      ]);
    }
    
    // Update meeting to mark it as having transcription
    await dbRun(`
      UPDATE meetings 
      SET has_transcription = 1, transcription_status = 'completed'
      WHERE id = ?
    `, [meetingId]);
    
    return { success: true };
  }

  // File system operations
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return data;
    } catch (error) {
      console.error('Failed to read file:', error);
      throw error;
    }
  });

  ipcMain.handle('write-file', async (event, filePath, data) => {
    try {
      await fs.writeFile(filePath, data, 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to write file:', error);
      throw error;
    }
  });

  // Window operations
  ipcMain.handle('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('maximize-window', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('close-window', () => {
    if (mainWindow) mainWindow.close();
  });

  // Notifications
  ipcMain.handle('show-notification', (event, title, body) => {
    if (Notification.isSupported()) {
      new Notification({
        title: title,
        body: body
      }).show();
    }
  });

  // AI Service handlers
  ipcMain.handle('ai-initialize', async () => {
    try {
      await whisperCppService.initialize();
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai-process-chunk', async (event, audioBuffer, sampleRate) => {
    try {
      const result = await whisperCppService.processAudioChunk(audioBuffer, sampleRate);
      return { success: true, result };
    } catch (error) {
      console.error('Failed to process audio chunk:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai-process-full-recording', async (event, audioBuffer, sampleRate, meetingId) => {
    try {
      console.log(`Processing full recording for meeting ${meetingId}`);
      console.log('Audio buffer type:', typeof audioBuffer);
      console.log('Sample rate:', sampleRate);
      
      if (!audioBuffer || audioBuffer.length === 0) {
        console.error('Audio buffer is empty or invalid');
        return { success: false, error: 'Audio buffer is empty or invalid' };
      }
      
      // Process the audio using the same method as real-time chunks
      const result = await whisperCppService.processAudioChunk(audioBuffer, sampleRate);
      console.log('Whisper.cpp result:', result);
      
      // Store transcription results in database
      console.log('Checking result structure:', {
        hasResult: !!result,
        hasSegments: !!(result && result.segments),
        segmentsLength: result?.segments?.length || 0
      });
      
      if (result && result.segments && result.segments.length > 0) {
        console.log(`Storing ${result.segments.length} transcript segments`);
        await saveTranscriptSegments(result.segments, meetingId);
        console.log('Updated meeting transcription status');
      } else {
        console.log('No segments found in result, not storing anything');
      }
      
      return { success: true, result };
    } catch (error) {
      console.error('Failed to process full recording:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('save-live-transcription-segments', async (event, segments, meetingId) => {
    try {
      console.log(`Saving ${segments.length} live transcription segments for meeting ${meetingId}`);
      return await saveTranscriptSegments(segments, meetingId);
    } catch (error) {
      console.error('Failed to save live transcription segments:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai-process-file', async (event, audioFilePath) => {
    try {
      const result = await whisperCppService.processAudioFile(audioFilePath);
      return { success: true, result };
    } catch (error) {
      console.error('Failed to process audio file:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai-get-status', async () => {
    try {
      return { 
        success: true, 
        initialized: whisperCppService.isInitialized,
        modelPath: whisperCppService.modelPath
      };
    } catch (error) {
      console.error('Failed to get AI service status:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('ai-shutdown', async () => {
    try {
      await whisperCppService.shutdown();
      return { success: true };
    } catch (error) {
      console.error('Failed to shutdown AI service:', error);
      return { success: false, error: error.message };
    }
  });

  // Llama.cpp Service handlers
  ipcMain.handle('llama-initialize', async () => {
    try {
      await llamaCppService.initialize();
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize Llama.cpp service:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('llama-answer-question', async (event, question, meetingId, transcripts, speakers) => {
    try {
      const answer = await llamaCppService.answerMeetingQuestion(question, meetingId, transcripts, speakers);
      return { success: true, answer };
    } catch (error) {
      console.error('Failed to answer question:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('llama-generate-summary', async (event, meetingId, transcripts, speakers) => {
    try {
      const summary = await llamaCppService.generateMeetingSummary(meetingId, transcripts, speakers);
      return { success: true, summary };
    } catch (error) {
      console.error('Failed to generate summary:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('llama-get-status', async () => {
    try {
      return { 
        success: true, 
        initialized: llamaCppService.isInitialized,
        modelPath: llamaCppService.modelPath
      };
    } catch (error) {
      console.error('Failed to get Llama.cpp service status:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('llama-clear-history', async (event, meetingId) => {
    try {
      llamaCppService.clearConversationHistory(meetingId);
      return { success: true };
    } catch (error) {
      console.error('Failed to clear conversation history:', error);
      return { success: false, error: error.message };
    }
  });
}

// Create application menu for macOS
function createMenu() {
  const template = [
    {
      label: 'Meeting Helper',
      submenu: [
        {
          label: 'About Meeting Helper',
          role: 'about'
        },
        { type: 'separator' },
        {
          label: 'Hide Meeting Helper',
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Meeting',
          accelerator: 'Command+N',
          click: () => {
            mainWindow.webContents.send('menu-new-meeting');
          }
        },
        { type: 'separator' },
        {
          label: 'Export Meeting',
          accelerator: 'Command+E',
          click: () => {
            mainWindow.webContents.send('menu-export-meeting');
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(async () => {
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Initialize AI services
    console.log('Initializing AI services...');
    try {
      await whisperCppService.initialize();
      console.log('Whisper.cpp service initialized successfully');
    } catch (whisperError) {
      console.warn('Whisper.cpp service initialization failed, will retry on demand:', whisperError.message);
    }
    
    try {
      await llamaCppService.initialize();
      console.log('Llama.cpp service initialized successfully');
    } catch (llamaError) {
      console.warn('Llama.cpp service initialization failed, will retry on demand:', llamaError.message);
    }
    
    // Then create window and set up handlers
    createWindow();
    createMenu();
    setupIpcHandlers();
    
    app.on('activate', () => {
      // On macOS, re-create window when dock icon is clicked
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // Show error dialog and quit
    const { dialog } = require('electron');
    dialog.showErrorBox('Initialization Error', 'Failed to initialize the application. Please try again.');
    app.quit();
  }
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, url) => {
    navigationEvent.preventDefault();
  });
}); 