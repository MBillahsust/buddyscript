'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { api } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';
import type { User } from '@/types';

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  const checks = [
    pwd.length >= 8,
    /[A-Z]/.test(pwd),
    /[0-9]/.test(pwd),
    /[^A-Za-z0-9]/.test(pwd),
    pwd.length >= 12,
  ];
  const score = checks.filter(Boolean).length;
  if (score <= 1) return { score, label: 'Weak', color: '#ff4d4f' };
  if (score <= 3) return { score, label: 'Fair', color: '#faad14' };
  if (score === 4) return { score, label: 'Good', color: '#52c41a' };
  return { score, label: 'Strong', color: '#1677ff' };
}

export function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = password.length > 0 ? getPasswordStrength(password) : null;
  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'At least one uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'At least one number', met: /[0-9]/.test(password) },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName || !email || !password) {
      setError('All fields are required.');
      return;
    }

    if (password !== repeatPassword) {
      setError('Passwords do not match.');
      return;
    }

    const unmet = requirements.filter(r => !r.met);
    if (unmet.length > 0) {
      setError('Password does not meet requirements: ' + unmet.map(r => r.label.toLowerCase()).join(', ') + '.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post<{ data: { accessToken: string; user: User } }>(
        '/auth/register',
        { firstName, lastName, email, password },
      );
      setToken(data.data.accessToken);
      setUser(data.data.user);
      document.cookie = 'bs_session=1; path=/; max-age=604800; SameSite=Lax';
      router.push('/feed');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data?.error;
        const details: Array<{ field: string; message: string }> = errorData?.details;
        if (details?.length) {
          setError(details.map(d => d.message).join(' '));
        } else {
          setError(errorData?.message ?? 'Registration failed. Please try again.');
        }
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="_social_registration_wrapper _layout_main_wrapper">
      <div className="_shape_one">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/images/shape1.svg" alt="" className="_shape_img" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/images/dark_shape.svg" alt="" className="_dark_shape" />
      </div>
      <div className="_shape_two">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/images/shape2.svg" alt="" className="_shape_img" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/images/dark_shape1.svg" alt="" className="_dark_shape _dark_shape_opacity" />
      </div>
      <div className="_shape_three">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/images/shape3.svg" alt="" className="_shape_img" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/images/dark_shape2.svg" alt="" className="_dark_shape _dark_shape_opacity" />
      </div>
      <div className="_social_registration_wrap">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
              <div className="_social_registration_right">
                <div className="_social_registration_right_image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/images/registration.png" alt="Image" />
                </div>
                <div className="_social_registration_right_image_dark">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/images/registration1.png" alt="Image" />
                </div>
              </div>
            </div>
            <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
              <div className="_social_registration_content">
                <div className="_social_registration_right_logo _mar_b28">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/images/logo.svg" alt="Image" className="_right_logo" />
                </div>
                <p className="_social_registration_content_para _mar_b8">Get Started Now</p>
                <h4 className="_social_registration_content_title _titl4 _mar_b50">Registration</h4>
                <button type="button" className="_social_registration_content_btn _mar_b40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/images/google.svg" alt="Image" className="_google_img" /> <span>Register with google</span>
                </button>
                <div className="_social_registration_content_bottom_txt _mar_b40"> <span>Or</span>
                </div>

                {error && (
                  <div
                    style={{
                      background: '#fff1f0',
                      border: '1px solid #ffa39e',
                      borderRadius: 6,
                      padding: '8px 12px',
                      marginBottom: 16,
                      color: '#cf1322',
                      fontSize: 14,
                    }}
                  >
                    {error}
                  </div>
                )}

                <form className="_social_registration_form" onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">First Name</label>
                        <input
                          type="text"
                          className="form-control _social_registration_input"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">Last Name</label>
                        <input
                          type="text"
                          className="form-control _social_registration_input"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">Email</label>
                        <input
                          type="email"
                          className="form-control _social_registration_input"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">Password</label>
                        <input
                          type="password"
                          className="form-control _social_registration_input"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                        />
                        {strength && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                              {[1, 2, 3, 4, 5].map(i => (
                                <div
                                  key={i}
                                  style={{
                                    flex: 1,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: i <= strength.score ? strength.color : '#e8e8e8',
                                    transition: 'background-color 0.2s',
                                  }}
                                />
                              ))}
                              <span style={{ fontSize: 12, color: strength.color, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {strength.label}
                              </span>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                              {requirements.map(req => (
                                <li key={req.label} style={{ fontSize: 12, color: req.met ? '#52c41a' : '#8c8c8c', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                                  <span>{req.met ? '✓' : '○'}</span> {req.label}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">Repeat Password</label>
                        <input
                          type="password"
                          className="form-control _social_registration_input"
                          value={repeatPassword}
                          onChange={e => setRepeatPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-12 col-xl-12 col-md-12 col-sm-12">
                      <div className="form-check _social_registration_form_check">
                        <input
                          className="form-check-input _social_registration_form_check_input"
                          type="checkbox"
                          id="flexRadioDefault2"
                          defaultChecked
                        />
                        <label className="form-check-label _social_registration_form_check_label" htmlFor="flexRadioDefault2">I agree to terms &amp; conditions</label>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
                      <div className="_social_registration_form_btn _mar_t40 _mar_b60">
                        <button
                          type="submit"
                          className="_social_registration_form_btn_link _btn1"
                          disabled={loading}
                        >
                          {loading ? 'Registering...' : 'Register now'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
                <div className="row">
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="_social_registration_bottom_txt">
                      <p className="_social_registration_bottom_txt_para">Already have an account? <Link href="/login">Login</Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
