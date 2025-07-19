-- Meeting Helper Database Schema
-- Version: 1.1.0

-- Meetings table - stores meeting metadata
CREATE TABLE IF NOT EXISTS meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT, -- Meeting description/agenda
  platform TEXT, -- 'zoom', 'teams', 'meet', 'manual'
  status TEXT DEFAULT 'ready', -- 'ready', 'recording', 'processing', 'completed'
  start_time DATETIME NOT NULL, -- Scheduled start time
  actual_start_time DATETIME, -- When recording actually started
  end_time DATETIME,
  duration INTEGER, -- seconds
  participant_count INTEGER,
  notes TEXT, -- Meeting notes
  summary TEXT, -- AI-generated meeting summary
  summary_generated_at DATETIME, -- When summary was generated
  transcription_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  has_transcription BOOLEAN DEFAULT 0, -- Whether meeting has transcription data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Transcripts table - stores individual transcript segments
CREATE TABLE IF NOT EXISTS transcripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id INTEGER NOT NULL,
  speaker_id TEXT, -- 'speaker_0', 'speaker_1', etc.
  text TEXT NOT NULL,
  start_time REAL NOT NULL, -- seconds from meeting start
  end_time REAL NOT NULL,
  confidence REAL, -- 0.0 to 1.0
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings (id) ON DELETE CASCADE
);

-- Speakers table - stores speaker information per meeting
CREATE TABLE IF NOT EXISTS speakers (
  id TEXT NOT NULL, -- 'speaker_0', 'speaker_1', etc.
  meeting_id INTEGER NOT NULL,
  display_name TEXT, -- User can assign names
  total_speaking_time INTEGER DEFAULT 0, -- seconds
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id, meeting_id),
  FOREIGN KEY (meeting_id) REFERENCES meetings (id) ON DELETE CASCADE
);

-- Settings table - stores app configuration
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transcripts_meeting_id ON transcripts(meeting_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_start_time ON transcripts(start_time);
CREATE INDEX IF NOT EXISTS idx_speakers_meeting_id ON speakers(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meetings_start_time ON meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_meetings_platform ON meetings(platform);

-- Triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_meetings_timestamp 
  AFTER UPDATE ON meetings
  BEGIN
    UPDATE meetings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_settings_timestamp 
  AFTER UPDATE ON settings
  BEGIN
    UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE key = NEW.key;
  END; 