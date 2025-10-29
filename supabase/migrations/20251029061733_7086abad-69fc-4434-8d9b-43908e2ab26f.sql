-- Create profiles table for user info
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create topics table
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  is_editable BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create topic_items table
CREATE TABLE IF NOT EXISTS public.topic_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(topic_id, position)
);

-- Create games table
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_vip_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  target_score INTEGER NOT NULL DEFAULT 1000,
  points_per_correct INTEGER NOT NULL DEFAULT 100,
  bonus_all_correct INTEGER NOT NULL DEFAULT 200,
  penalty_all_wrong INTEGER NOT NULL DEFAULT -50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create game_players table
CREATE TABLE IF NOT EXISTS public.game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, user_id)
);

-- Create rounds table
CREATE TABLE IF NOT EXISTS public.rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  vip_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'topic_selection' CHECK (status IN ('topic_selection', 'vip_ranking', 'player_guessing', 'revealing', 'complete')),
  reveal_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, round_number)
);

-- Create rankings table (VIP's ranking)
CREATE TABLE IF NOT EXISTS public.rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.topic_items(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(round_id, item_id),
  UNIQUE(round_id, position)
);

-- Create guesses table (player guesses)
CREATE TABLE IF NOT EXISTS public.guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.topic_items(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(round_id, user_id, item_id),
  UNIQUE(round_id, user_id, position)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guesses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for topics (public read, authenticated write for custom topics)
CREATE POLICY "Anyone can view topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create topics" ON public.topics FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own topics" ON public.topics FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own topics" ON public.topics FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for topic_items
CREATE POLICY "Anyone can view topic items" ON public.topic_items FOR SELECT USING (true);
CREATE POLICY "Topic creators can manage items" ON public.topic_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.topics 
    WHERE topics.id = topic_items.topic_id 
    AND topics.created_by = auth.uid()
  )
);

-- RLS Policies for games
CREATE POLICY "Players can view their games" ON public.games FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.game_players 
    WHERE game_players.game_id = games.id 
    AND game_players.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create games" ON public.games FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creator can update game" ON public.games FOR UPDATE USING (auth.uid() = creator_id);

-- RLS Policies for game_players
CREATE POLICY "Players can view game players" ON public.game_players FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.game_players gp 
    WHERE gp.game_id = game_players.game_id 
    AND gp.user_id = auth.uid()
  )
);
CREATE POLICY "Users can join games" ON public.game_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Players can update own record" ON public.game_players FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for rounds
CREATE POLICY "Players can view rounds" ON public.rounds FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.game_players 
    WHERE game_players.game_id = rounds.game_id 
    AND game_players.user_id = auth.uid()
  )
);
CREATE POLICY "VIP can create rounds" ON public.rounds FOR INSERT WITH CHECK (auth.uid() = vip_id);
CREATE POLICY "VIP can update rounds" ON public.rounds FOR UPDATE USING (auth.uid() = vip_id);

-- RLS Policies for rankings
CREATE POLICY "Players can view rankings after reveal" ON public.rankings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.rounds r
    JOIN public.game_players gp ON gp.game_id = r.game_id
    WHERE r.id = rankings.round_id 
    AND gp.user_id = auth.uid()
    AND r.status IN ('revealing', 'complete')
  )
);
CREATE POLICY "VIP can create rankings" ON public.rankings FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rounds 
    WHERE rounds.id = rankings.round_id 
    AND rounds.vip_id = auth.uid()
  )
);

-- RLS Policies for guesses
CREATE POLICY "Players can view own guesses" ON public.guesses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Players can view all guesses during reveal" ON public.guesses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.rounds r
    JOIN public.game_players gp ON gp.game_id = r.game_id
    WHERE r.id = guesses.round_id 
    AND gp.user_id = auth.uid()
    AND r.status IN ('revealing', 'complete')
  )
);
CREATE POLICY "Players can create guesses" ON public.guesses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rankings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.guesses;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.games FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed default topics from EditableCards JSON
INSERT INTO public.topics (name, is_editable) VALUES
  ('3AM Thoughts', false),
  ('After Dinner Scenes', false),
  ('After Guests Leave', false),
  ('Amusement Park Rides', false),
  ('Autumn highlights', false),
  ('Best Memory', false),
  ('Best Shoe Brands', false),
  ('Best Smells', false),
  ('Best Type of Nap', false),
  ('Best cartoon friend', false),
  ('Birthday Gift', false),
  ('Breakfast cereal', false),
  ('Childhood Games', false),
  ('Comfort Food', false),
  ('Comfort Shows', false),
  ('Dad''s Go-To Drink', false),
  ('Dance Styles', false),
  ('Disney Sidekick', false),
  ('Dream Job as a Kid', false),
  ('Energy Drink', false),
  ('F1 Teams', true),
  ('Family Trip Spot', false),
  ('Family Vacations Highlights', false),
  ('Fascinating Wonder Of The World', true),
  ('Favorite Disney movie', false),
  ('Favorite type of sandwich?', false),
  ('Funniest Family Member', false),
  ('Girl Group Vibe', false),
  ('Go-To Excuses', false),
  ('Go-To Group Activity', false),
  ('Holidays', false),
  ('Hot Take', false),
  ('IPL Teams', true),
  ('Iconic Brands', false),
  ('Instagram Aesthetic', false),
  ('Loudest Moment of your Family', false),
  ('Love Language Type', false),
  ('Magical Place to Visit', false),
  ('Mom''s Guilty Pleasure', false),
  ('Most Adorable Pet', false),
  ('Most Compatible', true),
  ('Most Likely Regret', false),
  ('Most Spoiled Member', false),
  ('Movie Genres', false),
  ('New Year''s Resolution', false),
  ('Outdoor adventure', false),
  ('Outfit Aesthetic', false),
  ('Road Trip Snack', false),
  ('Self-Care Essentials', false),
  ('Sport you love', false),
  ('The Original Disney Princesses', true),
  ('Theme Park Energy', false),
  ('Wedding Vibe', false),
  ('Weekend Personality', false),
  ('Winter Fun Activities', false)
ON CONFLICT (name) DO NOTHING;

-- Seed topic items (this is a large insert, showing pattern for first few topics)
-- Helper function to insert items for a topic
CREATE OR REPLACE FUNCTION insert_topic_items(topic_name TEXT, items TEXT[])
RETURNS void AS $$
DECLARE
  topic_uuid UUID;
  item TEXT;
  idx INTEGER := 1;
BEGIN
  SELECT id INTO topic_uuid FROM public.topics WHERE name = topic_name;
  FOREACH item IN ARRAY items
  LOOP
    INSERT INTO public.topic_items (topic_id, name, position) VALUES (topic_uuid, item, idx);
    idx := idx + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Insert all topic items
SELECT insert_topic_items('3AM Thoughts', ARRAY['Alien Existance', 'Fictional Scenes', 'Cringe Memories', 'Food Cravings', 'Existential Crisis', 'Pet''s Secret Life', 'Gratitude', 'Diabolic Thoughts', 'Future Vision', 'Random Thoughts']);
SELECT insert_topic_items('After Dinner Scenes', ARRAY['Dessert War', 'Couch Takeover', 'Story Time', 'Dishes Debate', 'Movie Time', 'Coffee & Gossip', 'Game Night', 'Late Night Walk', 'Meme Sharing', 'Read Book']);
SELECT insert_topic_items('After Guests Leave', ARRAY['Rant Mode', 'Cleanup Regret', 'Pack Leftovers', 'Juicy Gossip', 'Next Invite Ban', 'Celebration', 'Replay Conversations', 'Social Battery Zero', 'Pajama Party', 'Immediate Sleep']);
SELECT insert_topic_items('Amusement Park Rides', ARRAY['Roller Coaster', 'Swings', 'Ferris Wheel', 'Merry-Go-Rounds', 'Water Slides', 'Bumper Cars', 'Haunted Rides', 'Drop Tower', 'Teacups', 'Log Flume']);
SELECT insert_topic_items('Autumn highlights', ARRAY['Fall Leaves', 'Pumpkin Spice', 'Cozy Sweaters', 'Apple Picking', 'Halloween', 'Bonfires', 'Rain Wlalks', 'Pumpkin Pie', 'Movie Marathons', 'Candy']);
SELECT insert_topic_items('Best Memory', ARRAY['Sleepover', 'Summer Trip', 'Late-Night Talks', 'Inside Jokes', 'First Concert', 'Family Reunion', 'First Kiss', 'Surprise Parties', 'Christmas Eve', 'Birthday']);
SELECT insert_topic_items('Best Shoe Brands', ARRAY['Adidas', 'Nike', 'Under Armour', 'Puma', 'Asics', 'Converse', 'Vans', 'Reebok', 'Sketchers', 'New Balance']);
SELECT insert_topic_items('Best Smells', ARRAY['Fresh Bread', 'New Book', 'Gasoline', 'Sharpie', 'Rain', 'Coffee Brew', 'Fresh Laundry', 'Scented Candle', 'Ocean Breeze', 'Campfire Smoke']);
SELECT insert_topic_items('Best Type of Nap', ARRAY['Couch Coma', 'Meditation', 'Power Naps', 'Bathroom Naps', 'Car Drive', 'Desk Doze', 'Post-Lunch Slump', 'Plane Snooze', 'TV Background Nap', 'Partner Cuddles']);
SELECT insert_topic_items('Best cartoon friend', ARRAY['SpongeBob', 'Mickey Mouse', 'Bluey', 'Peppa Pig', 'Bugs Bunny', 'Scooby-Doo', 'Tom & Jerry', 'Patrick Star', 'Homer Simpson', 'Donald Duck']);
SELECT insert_topic_items('Birthday Gift', ARRAY['Gift Card', 'Merchandise', 'Books', 'Skin Care Set', 'Polaroid Camera', 'Perfume', 'Concert Tickets', 'Chocolate Box', 'Custom Jewelry', 'Tech Gadgets']);
SELECT insert_topic_items('Breakfast cereal', ARRAY['Lucky Charms', 'Frosted Flakes', 'Froot Loops', 'Cheerios', 'Cinnamon Crunch', 'Corn Flakes', 'Rice Krispies', 'Raisin Bran', 'Cocoa Puffs', 'Chocos']);
SELECT insert_topic_items('Childhood Games', ARRAY['Hide & Seek', 'Tag', 'Jump Rope', 'Dress Up', 'Simon Says', 'Hopscotch', 'Duck Duck Goose', 'Snake & Ladders', 'Monopoly', 'Ludo']);
SELECT insert_topic_items('Comfort Food', ARRAY['Ramen', 'Ice Cream', 'Pizza', 'Salad', 'Hotdogs', 'Cookies', 'Fries', 'Tacos', 'Chocolate Cake', 'Pasta']);
SELECT insert_topic_items('Comfort Shows', ARRAY['Reality Shows', 'K-Drama', 'Anime Binge', 'Sitcom', 'True Crime Docs', 'Horror', 'Baking Shows', 'Cartoons', 'Period dramas', 'Stand Up Comedies']);
SELECT insert_topic_items('Dad''s Go-To Drink', ARRAY['Black Coffee', 'Diet Coke', 'Iced Tea', 'Craft Beer', 'Bourbon Neat', 'Protein Shake', 'Hot Water', 'Green Tea', 'Smoothie', 'Rum']);
SELECT insert_topic_items('Dance Styles', ARRAY['Ballet', 'Salsa', 'Hip-Hop', 'Tap', 'Contemporary', 'Jazz', 'Breakdance', 'Ballroom', 'Freestyle', 'Swing']);
SELECT insert_topic_items('Disney Sidekick', ARRAY['Mushu (Mulan)', 'Genie (Aladdin)', 'Olaf (Frozen)', 'Dug (Up)', 'Hay Hay (Moana)', 'Pascal (Tangled)', 'Abu (Aladdin)', 'Baymax (Big Hero 6)', 'Timon (Lion King)', 'Sebastian (Little Mermaid)']);
SELECT insert_topic_items('Dream Job as a Kid', ARRAY['Astronaut', 'Superhero', 'Actor', 'Artist', 'Scientist', 'Athlete', 'Pilot', 'Chef', 'Traveller', 'Unemployed']);
SELECT insert_topic_items('Energy Drink', ARRAY['Red Bull', 'Monster', 'Gatorade', 'Prime', 'Rockstar', 'Diet Coke', 'Coffee', 'Iced Tea', 'Alcohol', 'Protein Drink']);
SELECT insert_topic_items('F1 Teams', ARRAY['McLaren', 'Mercedes', 'Ferrari', 'Red Bull Racing', 'Williams', 'Aston Martin', 'Racing Bulls', 'Kick Sauber', 'Haas F1 Team', 'Alpine']);
SELECT insert_topic_items('Family Trip Spot', ARRAY['House Party', 'Backyard BBQ', 'Camping Trip', 'Fishing Trip', 'Beach Day', 'Road Trip', 'Ski Resort', 'Grandma''s House', 'Amusement Park', 'Cruise']);
SELECT insert_topic_items('Family Vacations Highlights', ARRAY['Food Coma', 'Group Storytelling', 'Random Chaos', 'Photo Sessions', 'Game Nights', 'Lost Luggag', 'Car Karaoke', 'Matching Outfits', 'Pool Mishaps', 'Late-Night Laughs']);
SELECT insert_topic_items('Fascinating Wonder Of The World', ARRAY['Great Wall of China', 'Colosseum', 'Taj Mahal', 'Christ the Redeemer', 'Chichén Itzá', 'Machu Picchu', 'Petra']);
SELECT insert_topic_items('Favorite Disney movie', ARRAY['Lion King', 'Frozen', 'Toy Story', 'Moana', 'Encanto', 'Aladdin', 'Mulan', 'Finding Nemo', 'Cinderella', 'The Incredibles']);
SELECT insert_topic_items('Favorite type of sandwich?', ARRAY['PB&J', 'Grilled Cheese', 'Turkey Club', 'Ham & Cheese', 'Avocado', 'Tuna Melt', 'BLT', 'Nutella', 'Egg', 'Spinach & Corn']);
SELECT insert_topic_items('Funniest Family Member', ARRAY['Dad Jokes', 'Sassy Sibling', 'Mom''s Savageness', 'Comic Cousin', 'Iconic Grandma', 'Eldest Daughter', 'Middle Child', 'Drama Aunt', 'Family Pet', 'Rich Uncle']);
SELECT insert_topic_items('Girl Group Vibe', ARRAY['Glam Squad', 'Gossip Queens', 'Food Explorers', 'Meme Junkies', 'Chill & Cozy', 'Dance party', 'Pajama Party', 'Shopping Spree', 'Travel Partners', 'Wine nights']);
SELECT insert_topic_items('Go-To Excuses', ARRAY['Traffic', 'Sick Pet', 'Migraine', 'Missed Alarm', 'Lost Keys', 'Flat Tire', 'Phone Died', 'WiFi Issues', 'Family Emergency', 'Double Booked']);
SELECT insert_topic_items('Go-To Group Activity', ARRAY['Movie Night', 'Coffee Catch-Up', 'Road Trip', 'Game Night', 'Mall Hangout', 'Beach Day', 'Escape Room', 'Karaoke Night', 'Bowling', 'Hiking Adventure']);
SELECT insert_topic_items('Holidays', ARRAY['Halloween', 'Thanksgiving', 'St.Patrick''s Day', '4th Of July', 'Christmas', 'Easter', 'Diwali', 'Valentine''s Day', 'Labor Day', 'New Year''s Eve']);
SELECT insert_topic_items('Hot Take', ARRAY['Pizza''s Overrated', 'TikTok''s Cringe', 'Coffee Sucks', 'Crocs Are Cool', 'Dogs > People', 'Winter > Summer', 'Ketchup On Eggs', 'Pineapple On Pizza', 'Books > Movies', 'Cold Showers Rule']);
SELECT insert_topic_items('IPL Teams', ARRAY['CSK', 'RCB', 'DC', 'GT', 'KKR', 'SRH', 'RR', 'LSG', 'MI', 'PBKS']);
SELECT insert_topic_items('Iconic Brands', ARRAY['Nike', 'Tesla', 'Apple', 'Levis', 'Coca Cola', 'Google', 'Disney', 'Starbucks', 'Amazon', 'McDonalds']);
SELECT insert_topic_items('Instagram Aesthetic', ARRAY['Photo Dump', 'Food Pictures', 'All Selfies', 'Cool Edits', 'No Posts', 'Travel Pics', 'Black & White', 'Meme Account', 'Fitness Journey', 'Fan Page']);
SELECT insert_topic_items('Loudest Moment of your Family', ARRAY['Group Storytelling', 'Snacks Fight', 'Sibling Fights', 'Phone Calls', 'Grandma''s TV Volume', 'Car Karaoke', 'Game Nights', 'Morning Rush Hour', 'Dog barking', 'Festival Celebrations']);
SELECT insert_topic_items('Love Language Type', ARRAY['Deep Convos', 'Quality Time', 'Food Sharing', 'Sharing Memes', 'Compliments', 'Gift Giving', 'Physical touch', 'Remembering details', 'Acts of service', 'Sharing Clothes']);
SELECT insert_topic_items('Magical Place to Visit', ARRAY['Hogwarts', 'Narnia', 'Pandora', 'Neverland', 'Shire', 'Atlantis', 'Wakanda', 'Oz', 'Te Fiti', 'Asgard']);
SELECT insert_topic_items('Mom''s Guilty Pleasure', ARRAY['True Crime Movies', 'Target Runs', 'Reality TV', 'Online Shopping', 'Wine', 'Nap Time', 'Chocolates', 'Gossip Sessions', 'Paint', 'Binge Watch']);
SELECT insert_topic_items('Most Adorable Pet', ARRAY['Bunnies', 'Cats', 'Hamsters', 'Dogs', 'Birds', 'Guinea Pigs', 'Ferrets', 'Turtles', 'Snake', 'Lizard']);
SELECT insert_topic_items('Most Compatible', ARRAY['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Capricorn', 'Aquarius', 'Pisces']);
SELECT insert_topic_items('Most Likely Regret', ARRAY['Text Messages', 'Not Saying No', 'Haircuts', 'Binge Eating', 'Procrastinating', 'Skipped Plans', 'Bad Tattoos', 'Lost Friendships', 'Career Choices', 'Skipping Gym']);
SELECT insert_topic_items('Most Spoiled Member', ARRAY['Oldest Daughter', 'Mom', 'Youngest Son', 'Middle Child', 'The Dog', 'Grandma', 'Dad', 'Youngest Daughter', 'Only Child', 'The Cat']);
SELECT insert_topic_items('Movie Genres', ARRAY['Romcoms', 'Action Flicks', 'Horror', 'Drama', 'Documentaries', 'Sci-Fi', 'Fantasy', 'Animated', 'Romance', 'Crime']);
SELECT insert_topic_items('New Year''s Resolution', ARRAY['Save Money', 'Volunteer', 'Eat Healthy', 'Learn Something', 'Exercise', 'Read More', 'Travel', 'Get Organized', 'New Hobby', 'Be Kinder']);
SELECT insert_topic_items('Outdoor adventure', ARRAY['Hiking Trail', 'Beach Day', 'Bike Ride', 'Skating Park', 'Camping Trip', 'Kayaking', 'Rock Climbing', 'Road Trip', 'Surfing', 'Bonfire Night']);
SELECT insert_topic_items('Outfit Aesthetic', ARRAY['Comfy Casual', 'Gym Wear', 'All Black', 'Formals', 'Anything Clean', 'Cool Streetwear', 'Oversized', 'Overdressed', 'Retro Vibes', 'Bling']);
SELECT insert_topic_items('Road Trip Snack', ARRAY['Cheese doritos', 'Pickles', 'Chocolate', 'Slurpees', 'Corn nuts', 'Coffee', 'Chips', 'Burger', 'Popcorn', 'Gummy Bears']);
SELECT insert_topic_items('Self-Care Essentials', ARRAY['Sheet Masks', 'Hot Shower', 'Journaling', 'Beauty Sleep', 'Long Scroll', 'Painting', 'Meditation', 'Pedicure Time', 'Solo Dancing', 'Reading']);
SELECT insert_topic_items('Sport you love', ARRAY['NBA', 'Soccer', 'NFL', 'Tennis', 'UFC', 'Cricket', 'Formula 1', 'Rugby', 'Golf', 'Baseball']);
SELECT insert_topic_items('The Original Disney Princesses', ARRAY['Snow White', 'Cinderella', 'Aurora', 'Ariel', 'Belle', 'Jasmine', 'Pocahontas', 'Mulan']);
SELECT insert_topic_items('Theme Park Energy', ARRAY['Adrenaline junkie', 'Map reader', 'Snack hunter', 'Photographer', 'Bench-sitter', 'Ride Screamer', 'Queue Complaine', 'Souvenir Collector', 'Cotton Candy Chaser', 'Mascot Hugger']);
SELECT insert_topic_items('Wedding Vibe', ARRAY['Dancefloor maniac', 'Buffet strategist', 'BTS photographer', 'Gossiper', 'Avoid conversations', 'Crying During Vows', 'Family Drama Watcher', 'Uninvited Plus-One', 'Overdresser', 'Critiquer']);
SELECT insert_topic_items('Weekend Personality', ARRAY['Hardcore Gamer', 'Bookworm', 'Hibernation', 'Binge Mode', 'Adventure Junkie', 'Social Butterfly', 'Sleep Enthusiast', 'Gym Warrior', 'Road Tripper', 'Explore New Hobby']);
SELECT insert_topic_items('Winter Fun Activities', ARRAY['Skiing', 'Snowboarding', 'Ice-Skating', 'Snowman Making', 'Hot Chocolate', 'Sledding', 'Snowball Fights', 'Baking Cookies', 'Watching Movies', 'Tree Decorating']);

-- Clean up helper function
DROP FUNCTION insert_topic_items(TEXT, TEXT[]);