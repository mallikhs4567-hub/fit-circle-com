# FitCircle — Full Technical Overview

## 1. Architecture

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5 (SWC plugin)
- **Styling**: Tailwind CSS 3 + shadcn/ui (Radix primitives)
- **Routing**: React Router DOM v6
- **State Management**: TanStack React Query v5 (server state), React hooks (local state)
- **Fonts**: Space Grotesk (display), Inter (body)
- **PWA**: vite-plugin-pwa with service worker (workbox), offline caching, installable manifest
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation

### Backend (Lovable Cloud / Supabase)
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth (email/password, OTP, Google/Apple OAuth via `@lovable.dev/cloud-auth-js`)
- **Storage**: Supabase Storage (`post-media` public bucket)
- **Edge Functions**: Deno-based serverless (auto-deployed)
  - `cleanup-expired-media` — removes expired story media
- **Realtime**: Supabase Realtime (Postgres changes) for chat messages

### AI Workout Engine
- **Pose Detection**: MediaPipe Pose (loaded via CDN, `modelComplexity: 0` Lite)
- **Camera**: MediaPipe Camera Utils (CDN)
- **Processing**: Client-side only, 480×360 resolution, every-2nd-frame analysis
- **Features**:
  - 10 exercise types (Push-ups, Squats, Jumping Jacks, High Knees, Deadlift, Plank Hold, Tricep Dips, Lunges, Burpees, Mountain Climbers)
  - State-machine rep counting with angle-based detection
  - Real-time form scoring (0-100)
  - Voice coaching via Web Speech API
  - Skeleton overlay on canvas
- **Data Flow**: Only numeric results (reps, form score, duration, calories) saved to `workout_results` table

### Gamification System
- **XP Awards**: workout_completed (20), diet_completed (15), post_created (10), comment (5), daily_login (5)
- **Levels**: `floor(xp / 100) + 1`
- **Leaderboard**: Weekly XP aggregation via `weekly_xp_leaderboard` table
- **Streaks**: Daily checklist completion tracking

### Realtime Features
- Chat messages (Supabase Realtime postgres_changes)
- Notifications (database-driven via triggers)

---

## 2. Database Schema

### Tables

#### `profiles`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| user_id | uuid | No | — |
| username | text | No | — |
| email | text | Yes | — |
| avatar_url | text | Yes | — |
| goal | text | Yes | — |
| experience_level | text | Yes | — |
| height | integer | Yes | — |
| weight | integer | Yes | — |
| gender | text | Yes | — |
| bio | text | Yes | — |
| streak | integer | Yes | 0 |
| total_active_days | integer | Yes | 0 |
| xp | integer | Yes | 0 |
| created_at | timestamptz | No | now() |
| updated_at | timestamptz | No | now() |

**RLS**: Own profile CRUD; view friends/pending friends. XP/streak/total_active_days protected by `validate_profile_update` trigger.

#### `posts`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| user_id | uuid | No | — |
| content | text | No | — |
| image_url | text | Yes | — |
| type | text | Yes | 'story' |
| reactions | jsonb | Yes | {"clap":0,"fire":0,"heart":0} |
| view_count | integer | Yes | 0 |
| like_count | integer | Yes | 0 |
| expires_at | timestamptz | Yes | now() + 24h |
| created_at | timestamptz | No | now() |

**FK**: `posts.user_id → profiles.user_id`
**RLS**: Insert/delete own; all authenticated can view.

#### `post_likes`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| post_id | uuid | No | — |
| user_id | uuid | No | — |
| created_at | timestamptz | Yes | now() |

**FK**: `post_likes.post_id → posts.id`

#### `post_reactions`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| post_id | uuid | No | — |
| user_id | uuid | No | — |
| reaction_type | text | No | — |
| created_at | timestamptz | No | now() |

**FK**: `post_reactions.post_id → posts.id`

#### `post_views`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| post_id | uuid | No | — |
| user_id | uuid | No | — |
| created_at | timestamptz | Yes | now() |

**FK**: `post_views.post_id → posts.id`

#### `comments`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| post_id | uuid | No | — |
| user_id | uuid | No | — |
| content | text | No | — |
| created_at | timestamptz | No | now() |

**FK**: `comments.post_id → posts.id`

#### `chat_messages`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| sender_id | uuid | No | — |
| receiver_id | uuid | No | — |
| content | text | No | — |
| read_at | timestamptz | Yes | — |
| deleted_for | jsonb | Yes | [] |
| created_at | timestamptz | No | now() |

**RLS**: Insert as sender; update as receiver (read_at only); view if participant and not blocked/deleted.

#### `friendships`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| user_id | uuid | No | — |
| friend_id | uuid | No | — |
| status | text | Yes | 'pending' |
| created_at | timestamptz | No | now() |

#### `notifications`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| user_id | uuid | No | — |
| from_user_id | uuid | Yes | — |
| type | text | No | — |
| title | text | No | — |
| body | text | Yes | — |
| reference_id | text | Yes | — |
| read | boolean | No | false |
| created_at | timestamptz | No | now() |

#### `daily_checklists`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| user_id | uuid | No | — |
| date | date | No | CURRENT_DATE |
| workout_completed | boolean | Yes | false |
| diet_followed | boolean | Yes | false |
| completed_at | timestamptz | Yes | — |
| created_at | timestamptz | No | now() |

#### `workout_results`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| user_id | uuid | No | — |
| exercise_name | text | No | — |
| reps_completed | integer | No | 0 |
| avg_form_score | numeric | No | 0 |
| duration_seconds | integer | No | 0 |
| xp_earned | integer | No | 0 |
| calories_burned | integer | No | 0 |
| created_at | timestamptz | No | now() |

#### `weekly_xp_leaderboard`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| user_id | uuid | No | — |
| week_start | date | No | — |
| xp | integer | No | 0 |
| created_at | timestamptz | No | now() |

**Unique constraint**: (user_id, week_start)

#### `body_metrics`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| user_id | uuid | No | — |
| weight | numeric | Yes | — |
| shoulder_width_ratio | numeric | Yes | — |
| waist_ratio | numeric | Yes | — |
| posture_score | numeric | Yes | — |
| notes | text | Yes | — |
| created_at | timestamptz | No | now() |

#### `blocked_users`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| blocker_id | uuid | No | — |
| blocked_id | uuid | No | — |
| created_at | timestamptz | Yes | now() |

#### `story_replies`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| story_id | uuid | No | — |
| sender_id | uuid | No | — |
| receiver_id | uuid | No | — |
| content | text | No | — |
| created_at | timestamptz | Yes | now() |

**FK**: `story_replies.story_id → posts.id`

#### `push_subscriptions`
| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| user_id | uuid | No | — |
| endpoint | text | No | — |
| p256dh | text | No | — |
| auth | text | No | — |
| created_at | timestamptz | No | now() |

### Database Functions (14 total)
| Function | Purpose |
|----------|---------|
| `handle_new_user()` | Auto-creates profile on auth signup |
| `award_xp(p_user_id, p_amount)` | Atomically awards XP, updates leaderboard, returns level info |
| `search_users_by_username(search_username)` | Case-insensitive username search (SECURITY DEFINER) |
| `validate_profile_update()` | Prevents direct XP/streak/total_active_days modification |
| `protect_chat_message_fields()` | Prevents modification of immutable chat fields |
| `delete_chat_for_user(other_user_id)` | Soft-deletes chat messages for current user |
| `sync_post_reaction_counts()` | Syncs reaction counts to posts.reactions jsonb |
| `increment_view_count()` | Auto-increments post view_count on post_views insert |
| `update_like_count()` | Auto-updates post like_count on like/unlike |
| `notify_chat_message()` | Creates notification on new chat message |
| `notify_post_comment()` | Creates notification on new comment |
| `notify_post_like()` / `notify_post_unlike()` | Creates notification on like; decrements on unlike |
| `notify_friend_request()` / `notify_friend_accepted()` | Friend request notifications |
| `notify_story_reply()` | Story reply notification |
| `update_updated_at_column()` | Auto-updates `updated_at` timestamp |

### Storage Buckets
| Bucket | Public | Purpose |
|--------|--------|---------|
| `post-media` | Yes | Post/story images and videos |

---

## 3. Data Export

To export existing data, use the Lovable Cloud UI (Cloud tab → Database → Tables → Export) or connect directly via the Supabase connection string.

---

## 4. Running Outside Lovable

```bash
# Clone the repo
git clone <YOUR_GIT_URL>
cd <PROJECT_DIR>

# Install dependencies
npm install

# Set up environment variables (copy and fill in)
cp .env.example .env

# Start dev server
npm run dev

# Build for production
npm run build
npm run preview
```

**Requirements**: Node.js 18+, npm 9+

**Note**: You need a Supabase project for the backend. Create one at [supabase.com](https://supabase.com), apply the migrations from `supabase/migrations/`, and fill in the `.env` values.

---

## 5. Project Structure (Key Directories)

```
src/
├── components/
│   ├── ai-workout/     # AI workout session, camera feed, completion screen
│   ├── circle/         # Social feed: posts, stories, comments, media
│   ├── common/         # Shared: avatar, badges, splash, XP bar, notifications
│   ├── discover/       # User discovery/search
│   ├── fitness/        # Fitness dashboard: trackers, diet, workouts, analytics
│   ├── layout/         # AppLayout, BottomNav
│   ├── profile/        # User profiles, stories row
│   └── ui/             # shadcn/ui components (40+ primitives)
├── hooks/              # 15+ custom hooks (auth, profile, posts, chat, XP, etc.)
├── integrations/       # Supabase client & types (auto-generated)
├── lib/                # Utilities: angle math, exercise recognition, form analysis, voice coach
├── pages/              # 10 route pages
└── types/              # TypeScript interfaces
supabase/
├── config.toml         # Project config
├── functions/          # Edge functions
└── migrations/         # Database migrations (read-only)
```
