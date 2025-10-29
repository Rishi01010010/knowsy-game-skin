import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '@/contexts/GameContext';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedCard } from '@/components/ThemedCard';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

export const CreateGameScreen = () => {
  const navigate = useNavigate();
  const { entityId } = useParams();
  const { createGame } = useGame();
  const [selectedTopic, setSelectedTopic] = useState('');

  const topics = [
    { id: '1', title: 'Movies 2023' },
    { id: '2', title: 'Tech Giants' },
    { id: '3', title: 'Classic Books' },
  ];

  const handleCreate = () => {
    createGame();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <ThemedButton variant="outline" onClick={() => navigate(`/game-lobby/${entityId}`)}>
            <ArrowLeft className="w-4 h-4" />
          </ThemedButton>
          <h1 className="text-4xl font-bold gradient-text">Create New Game</h1>
        </div>

        <ThemedCard glow>
          <div className="space-y-6">
            <div>
              <Label htmlFor="topic">Select Topic</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger id="topic">
                  <SelectValue placeholder="Choose a topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Game Settings</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• You will be the VIP (host)</li>
                <li>• Set the correct rankings</li>
                <li>• Players guess the order</li>
                <li>• Points awarded for accuracy</li>
              </ul>
            </div>

            <ThemedButton
              gradient
              glow
              size="lg"
              className="w-full"
              onClick={handleCreate}
              disabled={!selectedTopic}
            >
              Create Game
            </ThemedButton>
          </div>
        </ThemedCard>
      </div>
    </div>
  );
};
