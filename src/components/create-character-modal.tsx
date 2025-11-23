'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createCharacter } from '@/actions/character';
import { LoaderCircle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useGameState } from '@/contexts/game-state';
import { SelectableIcons } from '@/lib/placeholder-images';

const characterSchema = z.object({
  name: z.string().min(1, { message: '名前は必須です。' }).max(20, { message: '名前は20文字以内です。'}),
  introduction: z.string().min(1, { message: '紹介文は必須です。' }).max(100, { message: '紹介文は100文字以内です。'}),
  description: z.string().min(1, { message: 'ペルソナは必須です。' }).max(500, { message: 'ペルソナは500文字以内です。'}),
  imagePath: z.string({ required_error: 'アイコンを選択してください。' }),
});

type CharacterFormValues = z.infer<typeof characterSchema>;

type CreateCharacterModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CreateCharacterModal({ isOpen, onClose }: CreateCharacterModalProps) {
  const { toast } = useToast();
  const { setErrorMessage } = useGameState();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CharacterFormValues>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      name: '',
      introduction: '',
      description: '',
      imagePath: SelectableIcons.length > 0 ? SelectableIcons[0].path : undefined,
    },
  });

  const handleClose = () => {
    if (isSubmitting) return;
    form.reset();
    onClose();
  }

  const onSubmit = async (data: CharacterFormValues) => {
    setIsSubmitting(true);
    setErrorMessage('');
    const result = await createCharacter(data);
    if (result.success) {
      toast({
        title: '成功',
        description: '新しいキャラクターを作成しました。',
      });
      handleClose();
    } else {
      setErrorMessage(result.message);
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>新しいキャラクターを作成</DialogTitle>
          <DialogDescription>
            あなただけのオリジナルキャラクターを作成して、対話を楽しみましょう。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="imagePath"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>アイコンを選択</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-5 gap-4"
                    >
                      {SelectableIcons.map((icon) => (
                        <FormItem key={icon.id} className="flex items-center justify-center">
                          <FormControl>
                            <RadioGroupItem value={icon.path} id={icon.id} className="sr-only" />
                          </FormControl>
                          <FormLabel
                            htmlFor={icon.id}
                            className="cursor-pointer rounded-lg border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          >
                             <Image
                                src={icon.path}
                                alt={`Icon ${icon.id}`}
                                width={80}
                                height={80}
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名前</FormLabel>
                  <FormControl>
                    <Input placeholder="例：陽気な商人、アラン" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="introduction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>紹介文（短い説明）</FormLabel>
                  <FormControl>
                    <Textarea placeholder="例：世界中の珍しい品物を扱う、旅の商人。" {...field} rows={2} />
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
                  <FormLabel>AIペルソナ（性格や口調の設定）</FormLabel>
                  <FormControl>
                    <Textarea placeholder="例：あなたは旅の商人、アランです。常に明るく、商売の話が大好きです。..." {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                作成
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
