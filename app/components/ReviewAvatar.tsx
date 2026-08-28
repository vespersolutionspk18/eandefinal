'use client';

type Props = {
  name: string;
  src: string;
};

export default function ReviewAvatar({ name, src }: Props) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      alt={name}
      loading="lazy"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).remove();
      }}
      src={src}
    />
  );
}
