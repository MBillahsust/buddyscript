"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import toast from "react-hot-toast"

type FieldErrors = {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
  general?: string
}

export function RegisterForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})

    const fd = new FormData(e.currentTarget)
    const firstName = (fd.get("firstName") as string).trim()
    const lastName = (fd.get("lastName") as string).trim()
    const email = (fd.get("email") as string).trim()
    const password = fd.get("password") as string
    const confirmPassword = fd.get("confirmPassword") as string

    // Client-side validation
    const newErrors: FieldErrors = {}
    if (!firstName) newErrors.firstName = "First name is required"
    if (!lastName) newErrors.lastName = "Last name is required"
    if (!email) newErrors.email = "Email is required"
    if (!password) newErrors.password = "Password is required"
    else if (password.length < 8) newErrors.password = "Password must be at least 8 characters"
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    // Step 1: Register
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      setLoading(false)
      if (res.status === 409) {
        setErrors({ email: "An account with this email already exists" })
      } else if (data.issues) {
        setErrors(data.issues)
      } else {
        setErrors({ general: data.error ?? "Registration failed" })
      }
      return
    }

    // Step 2: Auto sign-in
    const result = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)

    if (result?.error) {
      setErrors({ general: "Account created but login failed. Please login manually." })
    } else {
      toast.success("Account created!")
      router.push("/feed")
      router.refresh()
    }
  }

  return (
    <section className="_social_registration_wrapper _layout_main_wrapper">
      <div className="_shape_one">
        <img src="/assets/images/shape1.svg" alt="" className="_shape_img" />
        <img src="/assets/images/dark_shape.svg" alt="" className="_dark_shape" />
      </div>
      <div className="_shape_two">
        <img src="/assets/images/shape2.svg" alt="" className="_shape_img" />
        <img src="/assets/images/dark_shape1.svg" alt="" className="_dark_shape _dark_shape_opacity" />
      </div>
      <div className="_shape_three">
        <img src="/assets/images/shape3.svg" alt="" className="_shape_img" />
        <img src="/assets/images/dark_shape2.svg" alt="" className="_dark_shape _dark_shape_opacity" />
      </div>

      <div className="_social_registration_wrap">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
              <div className="_social_registration_right">
                <div className="_social_registration_right_image">
                  <img src="/assets/images/registration.png" alt="Register" />
                </div>
                <div className="_social_registration_right_image_dark">
                  <img src="/assets/images/registration1.png" alt="Register" />
                </div>
              </div>
            </div>

            <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
              <div className="_social_registration_content">
                <div className="_social_registration_right_logo _mar_b28">
                  <img src="/assets/images/logo.svg" alt="BuddyScript" className="_right_logo" />
                </div>
                <p className="_social_registration_content_para _mar_b8">Get Started Now</p>
                <h4 className="_social_registration_content_title _titl4 _mar_b50">
                  Registration
                </h4>

                <button
                  type="button"
                  className="_social_registration_content_btn _mar_b40"
                  onClick={() => toast("Google sign-up coming soon!")}
                >
                  <img src="/assets/images/google.svg" alt="Google" className="_google_img" />
                  <span>Register with google</span>
                </button>

                <div className="_social_registration_content_bottom_txt _mar_b40">
                  <span>Or</span>
                </div>

                {errors.general && (
                  <div className="alert alert-danger py-2 mb-3" role="alert">
                    {errors.general}
                  </div>
                )}

                <form className="_social_registration_form" onSubmit={handleSubmit}>
                  <div className="row">
                    {/* First Name */}
                    <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          className={`form-control _social_registration_input${errors.firstName ? " is-invalid" : ""}`}
                          placeholder="First name"
                        />
                        {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                      </div>
                    </div>
                    {/* Last Name */}
                    <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          className={`form-control _social_registration_input${errors.lastName ? " is-invalid" : ""}`}
                          placeholder="Last name"
                        />
                        {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                      </div>
                    </div>
                    {/* Email */}
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">Email</label>
                        <input
                          type="email"
                          name="email"
                          className={`form-control _social_registration_input${errors.email ? " is-invalid" : ""}`}
                          placeholder="Enter your email"
                        />
                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                      </div>
                    </div>
                    {/* Password */}
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">Password</label>
                        <input
                          type="password"
                          name="password"
                          className={`form-control _social_registration_input${errors.password ? " is-invalid" : ""}`}
                          placeholder="Min. 8 characters"
                        />
                        {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                      </div>
                    </div>
                    {/* Confirm Password */}
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_form_input _mar_b14">
                        <label className="_social_registration_label _mar_b8">Repeat Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          className={`form-control _social_registration_input${errors.confirmPassword ? " is-invalid" : ""}`}
                          placeholder="Repeat your password"
                        />
                        {errors.confirmPassword && (
                          <div className="invalid-feedback">{errors.confirmPassword}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-lg-12 col-xl-12 col-md-12 col-sm-12">
                      <div className="form-check _social_registration_form_check">
                        <input
                          className="form-check-input _social_registration_form_check_input"
                          type="checkbox"
                          id="terms"
                          required
                        />
                        <label
                          className="form-check-label _social_registration_form_check_label"
                          htmlFor="terms"
                        >
                          I agree to terms &amp; conditions
                        </label>
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
                          {loading ? "Creating account..." : "Create Account"}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                <div className="row">
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="_social_registration_bottom_txt">
                      <p className="_social_registration_bottom_txt_para">
                        Already have an account?{" "}
                        <Link href="/login">Login</Link>
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
  )
}
