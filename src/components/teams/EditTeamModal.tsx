import React, { useState } from 'react';
import { X, Users, Loader2, Palette } from 'lucide-react';
import { updateTeam } from '@/services/teams';
import type { Team } from '@/types/teams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  team: Team;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#10B981',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
];

export default function EditTeamModal({ team, onClose, onSuccess }: Props) {
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description || '');
  const [color, setColor] = useState(team.color);
  const [customColor, setCustomColor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }

    const finalColor = customColor || color;

    try {
      setLoading(true);
      setError(null);

      await updateTeam(team.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        color: finalColor,
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error updating team:', err);
      setError(err.message || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="text-white p-3 rounded-lg"
              style={{ backgroundColor: color }}
            >
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Modifier l'équipe</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Palette className="w-4 h-4 inline mr-1" />
              Couleur
            </label>
            <div className="grid grid-cols-9 gap-2 mb-3">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => {
                    setColor(presetColor);
                    setCustomColor('');
                  }}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${
                    color === presetColor && !customColor
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={customColor || color}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600">{customColor || color}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                'Modifier'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
