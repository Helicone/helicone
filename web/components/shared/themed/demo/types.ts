export interface Course {
  overview: CourseOverview;
  sections: CourseSection[];
  quizzes: CourseQuiz[];
}
export interface CourseQuiz {
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
}
export interface CourseSection {
  title: string;
  content: string;
}
export interface CourseOverview {
  title: string;
  description: string;
}
export interface CourseParams {
  topic: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  audience: string;
}
