'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { DarkModeToggle } from '@/components/layout/DarkModeToggle';
import { PostComposer } from './PostComposer';
import { PostList } from './PostList';
import { getUser, clearToken } from '@/lib/auth';
import type { User } from '@/types';

export function FeedPage() {
  const [isDark, setIsDark] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) {
      clearToken(); // also clears bs_session cookie so proxy won't loop back to /feed
      window.location.replace('/login');
      return;
    }
    setCurrentUser(user);

    const saved = localStorage.getItem('theme');
    if (saved === 'dark') setIsDark(true);
  }, []);

  const toggleDark = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  if (!currentUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`_layout _layout_main_wrapper${isDark ? ' _dark_wrapper' : ''}`}>
      <DarkModeToggle isDark={isDark} onToggle={toggleDark} />

      <div className="_main_layout">
        <Navbar currentUser={currentUser} />

        <div className="container _custom_container">
          <div className="_layout_inner_wrap">
            <div className="row">
              {/* Left Sidebar */}
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                <LeftSidebar />
              </div>

              {/* Middle — Feed */}
              <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                <div className="_layout_middle_wrap">
                  <div className="_layout_middle_inner">
                    {/* Stories */}
                    <div className="_feed_inner_ppl_card _mar_b16">
                      <div className="_feed_inner_story_arrow">
                        <button type="button" className="_feed_inner_story_arrow_btn">
                          <svg xmlns="http://www.w3.org/2000/svg" width="9" height="8" fill="none" viewBox="0 0 9 8">
                            <path fill="#fff" d="M8 4l.366-.341.318.341-.318.341L8 4zm-7 .5a.5.5 0 010-1v1zM5.566.659l2.8 3-.732.682-2.8-3L5.566.66zm2.8 3.682l-2.8 3-.732-.682 2.8-3 .732.682zM8 4.5H1v-1h7v1z"/>
                          </svg>
                        </button>
                      </div>
                      <div className="row">
                        <div className="col-xl-3 col-lg-3 col-md-4 col-sm-4 col">
                          <div className="_feed_inner_profile_story _b_radious6">
                            <div className="_feed_inner_profile_story_image">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src="/assets/images/card_ppl1.png" alt="" className="_profile_story_img" />
                              <div className="_feed_inner_story_txt">
                                <div className="_feed_inner_story_btn">
                                  <button type="button" className="_feed_inner_story_btn_link">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 10 10">
                                      <path stroke="#fff" strokeLinecap="round" d="M.5 4.884h9M4.884 9.5v-9"/>
                                    </svg>
                                  </button>
                                </div>
                                <p className="_feed_inner_story_para">Your Story</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-xl-3 col-lg-3 col-md-4 col-sm-4 col">
                          <div className="_feed_inner_public_story _b_radious6">
                            <div className="_feed_inner_public_story_image">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src="/assets/images/card_ppl2.png" alt="" className="_public_story_img" />
                              <div className="_feed_inner_pulic_story_txt">
                                <p className="_feed_inner_pulic_story_para">Ryan Roslansky</p>
                              </div>
                              <div className="_feed_inner_public_mini">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/assets/images/mini_pic.png" alt="" className="_public_mini_img" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-xl-3 col-lg-3 col-md-4 col-sm-4 _custom_mobile_none">
                          <div className="_feed_inner_public_story _b_radious6">
                            <div className="_feed_inner_public_story_image">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src="/assets/images/card_ppl3.png" alt="" className="_public_story_img" />
                              <div className="_feed_inner_pulic_story_txt">
                                <p className="_feed_inner_pulic_story_para">Ryan Roslansky</p>
                              </div>
                              <div className="_feed_inner_public_mini">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/assets/images/mini_pic.png" alt="" className="_public_mini_img" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-xl-3 col-lg-3 col-md-4 col-sm-4 _custom_none">
                          <div className="_feed_inner_public_story _b_radious6">
                            <div className="_feed_inner_public_story_image">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src="/assets/images/card_ppl4.png" alt="" className="_public_story_img" />
                              <div className="_feed_inner_pulic_story_txt">
                                <p className="_feed_inner_pulic_story_para">Ryan Roslansky</p>
                              </div>
                              <div className="_feed_inner_public_mini">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/assets/images/mini_pic.png" alt="" className="_public_mini_img" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  <PostComposer currentUser={currentUser} isDark={isDark} />
                    <PostList currentUser={currentUser} isDark={isDark} />
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                <RightSidebar />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
