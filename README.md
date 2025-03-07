# AI Flashcards API

A backend API that generates educational flashcards using Groq's large language models. The system generates comprehensive syllabi for user-requested topics and transforms them into interactive flashcards for effective learning.

## Architecture

### Overview
The application follows a RESTful API architecture with the following components:
1. **API Server**: Built with Hono.js framework
2. **LLM Integration**: Using Groq's API for content generation
3. **Database**: For storing topics, syllabi, and flashcards
4. **Authentication**: To manage user access and personalization
5. **Spaced Repetition System**: For optimizing learning retention and scheduling reviews
6. **Learning Analytics**: For tracking user performance and adapting content

### System Architecture Diagram

```
┌─────────────────┐         ┌───────────────┐         ┌───────────────────┐
│                 │         │               │         │                   │
│  Client         │◀────────▶  API Server   │◀────────▶  SQLite Database  │
│  Application    │   REST  │  (Hono.js)    │         │                   │
│                 │   API   │               │         └───────────────────┘
└─────────────────┘         └───────┬───────┘                  ▲
                                    │                          │
                                    ▼                          │
                            ┌───────────────┐                  │
                            │               │                  │
                            │  Groq LLM     │                  │
                            │  API Service  │                  │
                            │               │                  │
                            └───────────────┘                  │
                                    │                          │
                                    ▼                          │
┌─────────────────────────────────────────────────────────┐    │
│                                                         │    │
│  Learning Engine                                        │    │
│  ┌─────────────────┐   ┌─────────────────────────┐      │    │
│  │                 │   │                         │      │    │
│  │ Spaced          │   │ Performance Analytics   │───────────┘
│  │ Repetition      │   │ & Adaptive Learning     │      │
│  │ System          │   │                         │      │
│  └─────────────────┘   └─────────────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Data Flow
1. User requests a topic to study
2. System generates a comprehensive syllabus using Groq LLM
3. Syllabus is stored in the database
4. Flashcards are generated based on the syllabus
5. User can retrieve and interact with flashcards
6. System tracks user performance and adjusts review schedules
7. System identifies knowledge gaps and generates targeted content

## Database Schema (SQLite)

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Topics Table
```sql
CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_studied TIMESTAMP,
  proficiency_score REAL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Syllabi Table
```sql
CREATE TABLE syllabi (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  content TEXT NOT NULL, -- JSON string of syllabus structure
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  adaptation_count INTEGER DEFAULT 0,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);
```

### Flashcards Table
```sql
CREATE TABLE flashcards (
  id TEXT PRIMARY KEY,
  syllabus_id TEXT NOT NULL,
  subtopic_id TEXT NOT NULL, -- Reference to section in syllabus
  type TEXT CHECK(type IN ('info', 'mcq')) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT, -- For info cards
  options TEXT, -- JSON array as string for MCQ cards
  correct_option INTEGER, -- For MCQ cards
  difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  interval REAL DEFAULT 1, -- Days until next review
  ease_factor REAL DEFAULT 2.5, -- Multiplier for spaced repetition
  due_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  stage INTEGER DEFAULT 0, -- Current stage in spaced repetition sequence
  FOREIGN KEY (syllabus_id) REFERENCES syllabi(id) ON DELETE CASCADE
);
```

### User Flashcard Progress Table
```sql
CREATE TABLE user_flashcard_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  flashcard_id TEXT NOT NULL,
  next_review_date TIMESTAMP,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMP,
  confidence INTEGER DEFAULT 0, -- Scale of 1-5
  time_to_answer INTEGER, -- Milliseconds
  mastered BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE,
  UNIQUE(user_id, flashcard_id)
);
```

### Review History Table
```sql
CREATE TABLE review_history (
  id TEXT PRIMARY KEY,
  user_flashcard_progress_id TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  performance TEXT CHECK(performance IN ('again', 'hard', 'good', 'easy')) NOT NULL,
  time_taken INTEGER NOT NULL, -- Milliseconds
  is_correct BOOLEAN NOT NULL,
  FOREIGN KEY (user_flashcard_progress_id) REFERENCES user_flashcard_progress(id) ON DELETE CASCADE
);
```

### Knowledge Analysis Table
```sql
CREATE TABLE knowledge_analysis (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  weak_subtopics TEXT, -- JSON array as string
  strong_subtopics TEXT, -- JSON array as string
  overall_mastery REAL DEFAULT 0,
  recommended_focus TEXT, -- JSON array as string
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  UNIQUE(user_id, topic_id)
);
```

### Indexes
```sql
-- For faster user-related queries
CREATE INDEX idx_topics_user_id ON topics(user_id);
CREATE INDEX idx_user_flashcard_progress_user_id ON user_flashcard_progress(user_id);
CREATE INDEX idx_user_flashcard_progress_flashcard_id ON user_flashcard_progress(flashcard_id);
CREATE INDEX idx_knowledge_analysis_user_topic ON knowledge_analysis(user_id, topic_id);

-- For spaced repetition queries
CREATE INDEX idx_user_flashcard_next_review ON user_flashcard_progress(user_id, next_review_date);

-- For syllabus-based queries
CREATE INDEX idx_flashcards_syllabus_id ON flashcards(syllabus_id);
CREATE INDEX idx_flashcards_subtopic_id ON flashcards(subtopic_id);
```

## API Routes

### Authentication
- Handled by Better Auth

### Topics
- `GET /api/topics`: List user's topics
- `POST /api/topics`: Create a new topic and generate syllabus
- `GET /api/topics/:id`: Get topic details with syllabus
- `DELETE /api/topics/:id`: Delete a topic
- `GET /api/topics/:id/progress`: Get user's progress on a specific topic
- `GET /api/topics/:id/analysis`: Get strength/weakness analysis for a topic

### Flashcards
- `GET /api/topics/:id/flashcards`: Get all flashcards for a topic
- `POST /api/topics/:id/flashcards/generate`: Generate more flashcards for a topic
- `GET /api/flashcards/:id`: Get a specific flashcard
- `PUT /api/flashcards/:id/progress`: Update user progress with a flashcard

### Spaced Repetition
- `GET /api/study-queue`: Get user's due flashcards for review
- `POST /api/flashcards/:id/review`: Submit a review result for a flashcard
- `GET /api/study-stats`: Get user's study statistics and trends
- `POST /api/adaptive-learning/:topicId`: Request targeted flashcards for weak areas

### Learning Analytics
- `GET /api/analytics/overview`: Get overall learning progress
- `GET /api/analytics/topics/:id`: Get detailed analytics for a specific topic
- `GET /api/analytics/recommendations`: Get learning recommendations
- `GET /api/analytics/strengths-weaknesses`: Get analysis of strong and weak areas

## LLM Integration

### Syllabus Generation
The system uses Groq's LLM to generate a structured syllabus for any given topic. The prompt engineering ensures:
- Comprehensive coverage of the topic
- Logical organization of subtopics
- Appropriate depth based on the complexity

### Flashcard Generation
Two types of flashcards are generated:
1. **Info Cards**: Simple question-answer format for key concepts
2. **MCQ Cards**: Multiple-choice questions with one correct answer and three distractors

The flashcard generation prompts are designed to:
- Cover important concepts from the syllabus
- Vary in difficulty levels
- Test different cognitive abilities (recall, application, analysis)

### Adaptive Learning
The system uses LLM to:
- Analyze patterns in user performance data
- Identify knowledge gaps and misconceptions
- Generate new flashcards targeting weak areas
- Adjust existing content difficulty based on user mastery
- Recommend study paths based on performance analytics

## Spaced Repetition System

### Algorithm
The API implements the SuperMemo SM-2 algorithm for spaced repetition with some modifications:

1. **Initial Interval**: New cards start with a 1-day interval
2. **Review Grades**:
   - Again (1): Card returns to initial learning state
   - Hard (2): Interval increases by factor of 1.2
   - Good (3): Interval increases by factor of ease (default 2.5)
   - Easy (4): Interval increases by factor of ease * 1.3

3. **Ease Factor Adjustment**:
   - Decreases by 0.15-0.20 for "Again" or "Hard" responses
   - Increases by 0.10-0.15 for "Easy" responses
   - Minimum ease factor is 1.3

4. **Due Date Calculation**:
   - `newInterval = currentInterval * easeFactor * (performanceModifier)`
   - `nextDueDate = currentDate + newInterval`

### Adaptivity
The spaced repetition system adapts based on:
- User performance trends
- Time taken to answer
- Self-reported confidence
- Topic complexity
- Card difficulty rating

## Performance Tracking & Analysis

### Metrics Collected
- Success rate per flashcard and subtopic
- Response time distributions
- Learning curve progression
- Retention over time
- Review consistency
- Proficiency by subtopic
- Error patterns

### Strength/Weakness Analysis
The system performs periodic analysis to:
1. Identify subtopics with consistently low performance
2. Detect concepts frequently missed or confused
3. Recognize patterns in error types
4. Map knowledge gaps against syllabus structure
5. Calculate proficiency scores for each knowledge area

### Adaptive Content Generation
Based on the analysis, the system:
1. Generates more flashcards for weak areas
2. Increases review frequency for challenging concepts
3. Creates remedial content explaining misconceptions
4. Adjusts difficulty of existing flashcards
5. Modifies parts of the syllabus to address knowledge gaps
6. Recommends supplementary learning resources

## Development

### Prerequisites
- Node.js 18+
- Groq API key
- SQLite3

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Initialize the SQLite database: `npm run init-db`
4. Create a `.env` file with required environment variables
5. Run the development server: `npm run dev`

### Environment Variables
```
GROQ_API_KEY=your_groq_api_key
DATABASE_PATH=./data/flashcards.db
JWT_SECRET=your_jwt_secret
```

## Deployment
The API can be deployed to various platforms like Vercel, Cloudflare Workers, or any Node.js hosting service.

## Future Enhancements
- Integration with existing learning management systems
- Advanced visualization of learning progress
- Collaborative features for sharing topics and flashcards
- More flashcard types (e.g., fill-in-the-blank, matching)
- Mobile notifications for study reminders
- Gamification elements to increase engagement
