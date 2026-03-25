-- Create saved_recipes table
CREATE TABLE public.saved_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL,
  recipe_title TEXT NOT NULL,
  recipe_image TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Enable RLS
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own saved recipes"
  ON public.saved_recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save recipes"
  ON public.saved_recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their saved recipes"
  ON public.saved_recipes FOR DELETE
  USING (auth.uid() = user_id);