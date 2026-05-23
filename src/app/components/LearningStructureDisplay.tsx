import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Topic {
  title: string;
  summaryContent: string;
  keyConcepts: string[];
}

interface Chapter {
  title: string;
  summary: string;
  keyConcepts: string[];
  topics: Topic[];
}

interface LearningStructureDisplayProps {
  chapters: Chapter[];
}

const LearningStructureDisplay: React.FC<LearningStructureDisplayProps> = ({ chapters }) => {
  const [openChapterIndex, setOpenChapterIndex] = useState<number | null>(0); // Open the first chapter by default

  const toggleChapter = (index: number) => {
    setOpenChapterIndex(openChapterIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {chapters.map((chapter, chapterIndex) => (
        <div key={chapterIndex} className="rounded-lg border border-slate-200 bg-white shadow-sm hover:border-orange-300 transition-colors duration-200">
          <button
            className="flex w-full items-center justify-between p-4 text-left"
            onClick={() => toggleChapter(chapterIndex)}
          >
            <h4 className="text-lg font-semibold text-orange-700">Chương {chapterIndex + 1}: {chapter.title}</h4>
            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openChapterIndex === chapterIndex ? 'rotate-180' : ''}`} />
          </button>
          {openChapterIndex === chapterIndex && (
            <div className="border-t border-slate-200 p-4">
              <p className="text-sm text-slate-600 mb-3">{chapter.summary}</p>
              {chapter.keyConcepts && chapter.keyConcepts.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs font-medium text-gray-800">Khái niệm chính: </span>
                  <span className="text-xs text-slate-700">{chapter.keyConcepts.join(', ')}</span>
                </div>
              )}
              {chapter.topics && chapter.topics.length > 0 && (
                <div className="ml-4 mt-3 space-y-4">
                  {chapter.topics.map((topic, topicIndex) => (
                    <div key={topicIndex} className="border-l-2 border-orange-200 pl-4">
                      <h5 className="text-md font-medium text-gray-800 mb-1">Mục {chapterIndex + 1}.{topicIndex + 1}: {topic.title}</h5>
                      <p className="text-xs text-slate-500">{topic.summaryContent}</p>
                      {topic.keyConcepts && topic.keyConcepts.length > 0 && (
                        <div className="mt-1">
                          <span className="text-xs font-medium text-slate-400">Từ khóa: </span>
                          <span className="text-xs text-slate-600">{topic.keyConcepts.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default LearningStructureDisplay;