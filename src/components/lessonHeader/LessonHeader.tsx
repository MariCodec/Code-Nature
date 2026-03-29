import styles from './LessonHeader.module.scss';

interface LessonHeaderProps {
  title: string;
  description: string;
}
export default function LessonHeader({ title, description }: LessonHeaderProps) {
  return (
    <div className={styles.lessonHeader}>
      <div className={styles.lessonTitle}>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
