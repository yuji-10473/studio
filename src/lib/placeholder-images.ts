import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  path: string;
  description: string;
  imageHint: string;
};

export type SelectableIcon = {
  id: string;
  path: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;
export const SelectableIcons: SelectableIcon[] = data.selectableIcons;
