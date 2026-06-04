import React, { useState } from 'react';
import { ChevronDown, BookOpen, Key, Target } from 'lucide-react';

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

const ChapterItem: React.FC<{
  chapter: Chapter;
  chapterIndex: number;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ chapter, chapterIndex, isOpen, onToggle }) => {
  // First topic is open by default
  const [openTopicIndex, setOpenTopicIndex] = useState<number | null>(0);

  const toggleTopic = (index: number) => {
    setOpenTopicIndex(openTopicIndex === index ? null : index);
  };

  return (
    <div 
      className={`rounded-2xl border transition-all duration-300 ${isOpen ? 'border-[#FF6B00]/30 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)]' : 'border-slate-200 bg-white hover:border-slate-300'}`}
    >
      {/* Chapter Header Button */}
      <button
        type="button"
        className="flex w-full items-center justify-between p-5 text-left outline-none group"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm transition-all duration-300 ${isOpen ? 'bg-gradient-to-br from-[#FF8A3D] to-[#FF6B00] text-white shadow-md shadow-orange-500/10' : 'bg-slate-100 text-slate-500 group-hover:bg-orange-50 group-hover:text-[#FF6B00]'}`}>
            {String(chapterIndex + 1).padStart(2, '0')}
          </div>
          <div className="min-w-0">
            <h4 className={`text-base font-extrabold truncate transition-colors duration-200 ${isOpen ? 'text-[#FF6B00]' : 'text-slate-700 group-hover:text-[#FF6B00]'}`}>
              {chapter.title}
            </h4>
            <p className="text-xs text-slate-400 font-medium truncate mt-0.5 max-w-[500px]">
              {chapter.summary}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#FF6B00]' : 'group-hover:text-[#FF6B00]'}`} />
      </button>

      {/* Chapter Details */}
      {isOpen && (
        <div className="border-t border-slate-100 p-6 space-y-6 bg-slate-50/20 rounded-b-2xl">
          {/* Summary Box with visual highlights */}
          <div className="p-4 rounded-xl border-l-4 border-l-[#FF6B00] bg-gradient-to-r from-[#FFFBF9] to-white border-y border-r border-orange-100/30 shadow-sm shadow-[#FF6B00]/5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF6B00] mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              Tóm tắt chương
            </div>
            <p className="text-sm leading-relaxed text-slate-600 font-semibold">{chapter.summary}</p>
          </div>

          {/* Key Concepts Tags with high visual pop */}
          {chapter.keyConcepts && chapter.keyConcepts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                Khái niệm cốt lõi
              </div>
              <div className="flex flex-wrap gap-2">
                {chapter.keyConcepts.map((concept, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center rounded-lg bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800 shadow-sm"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Collapsible Interactive Timeline of Topics */}
          {chapter.topics && chapter.topics.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                Danh sách bài học
              </div>
              
              <div className="relative pl-6 ml-3 border-l border-slate-200/80 space-y-4 py-1">
                {chapter.topics.map((topic, topicIndex) => {
                  const isTopicOpen = openTopicIndex === topicIndex;
                  return (
                    <div key={topicIndex} className="relative group/topic">
                      {/* Timeline node circle */}
                      <span 
                        onClick={() => toggleTopic(topicIndex)}
                        className={`absolute -left-[32px] cursor-pointer z-10 transition-all duration-300 ${
                          isTopicOpen 
                            ? 'h-4 w-4 rounded-full border-2 border-[#FF6B00] bg-white ring-4 ring-orange-100 top-1.5' 
                            : 'h-3 w-3 rounded-full border-2 border-slate-300 bg-white hover:border-[#FF6B00] top-2'
                        }`} 
                      />

                      <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                        isTopicOpen 
                          ? 'border-slate-200 bg-white shadow-sm' 
                          : 'border-transparent bg-transparent hover:bg-slate-50/50'
                      }`}>
                        {/* Topic Header Toggle Button */}
                        <button
                          type="button"
                          onClick={() => toggleTopic(topicIndex)}
                          className="flex w-full items-center justify-between px-3 py-1.5 text-left outline-none group/topic-btn"
                        >
                          <h5 className={`text-sm font-bold transition-colors duration-150 ${
                            isTopicOpen ? 'text-[#FF6B00] font-extrabold' : 'text-slate-600 group-hover/topic-btn:text-[#FF6B00]'
                          }`}>
                            {chapterIndex + 1}.{topicIndex + 1} {topic.title}
                          </h5>
                          <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                            isTopicOpen ? 'rotate-180 text-[#FF6B00]' : 'group-hover/topic-btn:text-[#FF6B00]'
                          }`} />
                        </button>

                        {/* Topic Body Content */}
                        {isTopicOpen && (
                          <div className="px-3 pb-3.5 pt-1 space-y-3 border-t border-slate-50">
                            <p className="text-xs leading-relaxed text-slate-500 font-medium">
                              {topic.summaryContent}
                            </p>
                            {topic.keyConcepts && topic.keyConcepts.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-50">
                                <span className="text-[10px] font-bold text-slate-400">Từ khóa:</span>
                                {topic.keyConcepts.map((kw, kwIdx) => (
                                  <span 
                                    key={kwIdx}
                                    className="inline-flex items-center rounded-md bg-slate-50 border border-slate-200/50 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition"
                                  >
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const LearningStructureDisplay: React.FC<LearningStructureDisplayProps> = ({ chapters }) => {
  const [openChapterIndex, setOpenChapterIndex] = useState<number | null>(0); // Open the first chapter by default

  const toggleChapter = (index: number) => {
    setOpenChapterIndex(openChapterIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {chapters.map((chapter, chapterIndex) => (
        <ChapterItem
          key={chapterIndex}
          chapter={chapter}
          chapterIndex={chapterIndex}
          isOpen={openChapterIndex === chapterIndex}
          onToggle={() => toggleChapter(chapterIndex)}
        />
      ))}
    </div>
  );
};

export default LearningStructureDisplay;