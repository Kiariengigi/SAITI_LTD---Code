import axios from "../api/axios";
const SIGN_UP_URL = "auth/register";
import { useRef, useState, useEffect, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faTimes,
  faInfoCircle,
  faShieldHeart,
  faUserPlus,
  faEnvelope,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { Card } from "react-bootstrap";
import "../Styles/Signup_form.css";

function Signup_form() {
  const navigate = useNavigate();
  const USER_REGEX = /^[a-zA-Z\s'-]{2,100}$/;
  const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;

  const userRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const errRef = useRef<HTMLParagraphElement | null>(null);
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [validName, setValidName] = useState(false);
  const [userFocus, setUserFocus] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwd, setPwd] = useState("");
  const [validPwd, setValidPwd] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);
  const [matchPwd, setMatchPwd] = useState("");
  const [validMatch, setValidMatch] = useState(false);
  const [matchFocus, setMatchFocus] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v1 = USER_REGEX.test(user);
    const v2 = PWD_REGEX.test(pwd);

    if (!v1 || !v2) {
      setErrMsg("Invalid Entry");
      return;
    }

    try {
      const response = await axios.post(
        SIGN_UP_URL,
        JSON.stringify({
          fullName: user,
          email,
          password: pwd,
          password_confirmation: matchPwd,
        }),
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      const accessToken = response.data?.data?.accessToken;

      if (accessToken) {
        window.localStorage.setItem("accessToken", accessToken);
      }

      setSuccess(true);
      setUser("");
      setEmail("");
      setPwd("");
      setMatchPwd("");
      navigate("/signup/userdetails");
    } catch (err: any) {
      if (!err?.response) {
        setErrMsg("No Server Response");
      } else if (err.response?.status === 409) {
        setErrMsg("Username Taken");
      } else {
        setErrMsg("Registration Failed");
      }
      errRef.current?.focus();
    }
  };

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  useEffect(() => {
    setValidName(USER_REGEX.test(user));
  }, [user]);

  useEffect(() => {
    setValidPwd(PWD_REGEX.test(pwd));
    setValidMatch(pwd === matchPwd);
  }, [pwd, matchPwd]);

  useEffect(() => {
    setErrMsg("");
  }, [user, email, pwd, matchPwd]);

  useEffect(() => {
    if (success) {
      navigate("/signup/userdetails");
    }
  }, [success, navigate]);

  return (
    <section className="signup-card">
      <p ref={errRef} className={errMsg ? "errmsg signup-error" : "offscreen"} aria-live="assertive">
        {errMsg}
      </p>

      <div className="signup-header">
        <span className="signup-badge">
          <FontAwesomeIcon icon={faUserPlus} /> Create account
        </span>
        <h1>Register your business</h1>
        <p>Build your account with a cleaner, faster onboarding flow designed for wholesale teams.</p>
      </div>

      <Card className="signup-intro-card border-0">
        <Card.Body className="p-0">
          <div className="signup-benefits">
            <div className="signup-benefit">
              <FontAwesomeIcon icon={faShieldHeart} />
              Secure account setup
            </div>
            <div className="signup-benefit">
              <FontAwesomeIcon icon={faUserPlus} />
              Guided profile registration
            </div>
          </div>
        </Card.Body>
      </Card>

      <form onSubmit={handleSubmit} className="signup-form">
        <label htmlFor="username" className="signup-label">
          Full Name
          <span className="signup-validity">
            <FontAwesomeIcon icon={faCheck} className={validName ? "valid" : "hide"} />
            <FontAwesomeIcon icon={faTimes} className={validName || !user ? "hide" : "invalid"} />
          </span>
        </label>
        <input
          type="text"
          id="username"
          className="modern-input"
          ref={userRef}
          autoComplete="name"
          placeholder="Enter your full name"
          onChange={(e) => setUser(e.target.value)}
          value={user}
          required
          aria-invalid={validName ? "false" : "true"}
          aria-describedby="uidnote"
          onFocus={() => setUserFocus(true)}
          onBlur={() => setUserFocus(false)}
        />
        <p id="uidnote" className={userFocus && user && !validName ? "instructions" : "offscreen"}>
          <FontAwesomeIcon icon={faInfoCircle} />
          Use a business or personal name that is 2 to 100 characters long.
        </p>

        <label htmlFor="email" className="signup-label">
          Email address
          <span className="signup-validity">
            <FontAwesomeIcon icon={faEnvelope} />
          </span>
        </label>
        <input
          type="email"
          id="email"
          className="modern-input"
          ref={emailRef}
          autoComplete="email"
          placeholder="name@company.com"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          required
          aria-invalid={email ? "false" : "true"}
          aria-describedby="emailnote"
          onFocus={() => setEmailFocus(true)}
          onBlur={() => setEmailFocus(false)}
        />
        <p id="emailnote" className={emailFocus && email ? "instructions" : "offscreen"}>
          <FontAwesomeIcon icon={faInfoCircle} />
          Use a business email so account updates reach the right team.
        </p>

        <label htmlFor="password" className="signup-label">
          Password
          <span className="signup-validity">
            <FontAwesomeIcon icon={faLock} />
            <FontAwesomeIcon icon={faCheck} className={validPwd ? "valid" : "hide"} />
            <FontAwesomeIcon icon={faTimes} className={validPwd || !pwd ? "hide" : "invalid"} />
          </span>
        </label>
        <input
          type="password"
          id="password"
          className="modern-input"
          placeholder="Create a strong password"
          onChange={(e) => setPwd(e.target.value)}
          value={pwd}
          required
          aria-invalid={validPwd ? "false" : "true"}
          aria-describedby="pwdnote"
          onFocus={() => setPwdFocus(true)}
          onBlur={() => setPwdFocus(false)}
        />
        <p id="pwdnote" className={pwdFocus && !validPwd ? "instructions" : "offscreen"}>
          <FontAwesomeIcon icon={faInfoCircle} />
          8 to 24 characters with uppercase, lowercase, a number, and a special character.
        </p>

        <label htmlFor="confirm_pwd" className="signup-label">
          Confirm Password
          <span className="signup-validity">
            <FontAwesomeIcon icon={faCheck} className={validMatch && matchPwd ? "valid" : "hide"} />
            <FontAwesomeIcon icon={faTimes} className={validMatch || !matchPwd ? "hide" : "invalid"} />
          </span>
        </label>
        <input
          type="password"
          id="confirm_pwd"
          className="modern-input"
          placeholder="Re-enter your password"
          onChange={(e) => setMatchPwd(e.target.value)}
          value={matchPwd}
          required
          aria-invalid={validMatch ? "false" : "true"}
          aria-describedby="confirmnote"
          onFocus={() => setMatchFocus(true)}
          onBlur={() => setMatchFocus(false)}
        />
        <p id="confirmnote" className={matchFocus && !validMatch ? "instructions" : "offscreen"}>
          <FontAwesomeIcon icon={faInfoCircle} />
          Must match the password above.
        </p>

        <button className="signup-submit" disabled={!validName || !validPwd || !validMatch}>
          Sign Up
        </button>
      </form>

      <p className="signup-footer-note">
        Already registered? <span className="signup-footer-link">Sign in instead</span>
      </p>
    </section>
  );
}

export default Signup_form;