
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useGameState } from '@/contexts/game-state';
import type { Character, CharacterId } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SelectableIcons } from '@/lib/placeholder-images';

const personaSchema = z.object({
  description: z.string().min(1, 'ペルソナは必須です。').max(2000, 'ペルソナは2000文字以内です。'),
  imagePath: z.string({ required_error: 'アイコンを選択してください。' }),
  unlockCost: z.coerce.number().int().min(0, '0以上の数値を入力してください。').optional(),
});

type PersonaFormValues = z.infer<typeof personaSchema>;

type PersonaEditorProps = {
  character: Character;
  characterId: CharacterId;
  onSave?: () => void;
};

export default function PersonaEditor({ character, characterId, onSave }: PersonaEditorProps) {
  const { updateCharacterPersona, setErrorMessage } = useGameState();
  const { toast } = useToast();

  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(personaSchema),
    defaultValues: {
      description: character.description || '',
      imagePath: character.imagePath || '',
      unlockCost: character.unlockCost || 0,
    },
  });
  
  useEffect(() => {
    form.reset({
      description: character.description || '',
      imagePath: character.imagePath || '',
      unlockCost: character.unlockCost || 0,
    });
  }, [character, form]);


  const handleSave = async (data: PersonaFormValues) => {
    setErrorMessage('');
    const imagePathHighAffection = data.imagePath.replace('b.png', 'a.png');
    
    const updateData = {
      ...data,
      imagePathHighAffection,
    };
    
    try {
      await updateCharacterPersona(characterId, updateData);
      toast({
        title: "成功",
        description: "キャラクターの情報を更新しました。"
      });
      onSave?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : '不明なエラーが発生しました。';
      setErrorMessage(`ペルソナの更新に失敗しました: ${message}`);
    }
  };

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="imagePath"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>アイコン</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-5 gap-4"
                    >
                      {SelectableIcons.map((icon) => (
                        <FormItem key={icon.id} className="flex items-center justify-center">
                          <FormControl>
                            <RadioGroupItem value={icon.path} id={`edit-${icon.id}`} className="sr-only" />
                          </FormControl>
                          <FormLabel
                            htmlFor={`edit-${icon.id}`}
                            className="cursor-pointer rounded-lg border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                             <Image
                                src={icon.path}
                                alt={`Icon ${icon.id}`}
                                width={60}
                                height={60}
                                className="rounded-md"
                              />
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AIペルソナ (役割設定)</FormLabel>
                  <FormControl>
                    <Textarea
                      id="persona-description"
                      rows={6}
                      className="text-sm"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                   <FormMessage />
                </FormItem>
              )}
            />
             {character.isLocked && (
              <FormField
                control={form.control}
                name="unlockCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>解放コスト（生産ポイント）</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="例: 20" 
                        disabled={form.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
                    {form.formState.isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    保存
                </Button>
            </div>
        </form>
    </Form>
  );
}
