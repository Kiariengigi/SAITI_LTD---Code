import axios from "../api/axios"
const SIGN_UP_URL = "/api/auth/register"
import { useRef, useState, useEffect, type FormEvent } from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faTimes, faInfoCircle } from "@fortawesome/free-solid-svg-icons"
import { useNavigate } from 'react-router-dom';
function Signup_form() {

    const navigate = useNavigate()
  const USER_REGEX = /^[a-zA-Z\s'-]{2,100}$/
    const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/


    const userRef = useRef<HTMLInputElement | null>(null);
    const emailRef = useRef<HTMLInputElement | null>(null)
    const errRef = useRef<HTMLParagraphElement | null>(null);
    const [user, setUser] = useState("");
    const [email, setEmail] = useState("")
    const [validName, setValidName] = useState(false);
    const [userFocus, setUserFocus] = useState(false);
    const [emailFocus, setEmailFocus] = useState(false)
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
        const v1 = USER_REGEX.test(user)
        const v2 = PWD_REGEX.test(pwd)

        if (!v1 || !v2) {
            setErrMsg("Invalid Entry")
            return
        }

        try {
            await axios.post(
                SIGN_UP_URL, 
                JSON.stringify({ 
                    fullName: user, 
                    email, 
                    password: pwd, 
                    password_confirmation: matchPwd
                 }), 
                {
                    headers: { "Content-Type": "application/json" },
                    withCredentials: true,
                }
            )
            setSuccess(true)
            setUser("")
            setEmail("")
            setPwd("")
            setMatchPwd("")
            navigate('/signup/userdetails')
        } catch (err: any) {
            if (!err?.response) {
                setErrMsg("No Server Response")
            } else if (err.response?.status === 409){
                setErrMsg("Username Taken")
            } else {
                setErrMsg("Registration Failed")
            }
            errRef.current?.focus()
        }
    }

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
    if (success) {
      return (
        <section>
          <h1>Success!</h1>
          <p>Your account has been created.</p>
        </section>
      );
    }

     return (
    <>
      <section>
        <p
          ref={errRef}
          className={errMsg ? "errmsg" : "offscreen"}
          aria-live="assertive"
        >
          {errMsg}
        </p>
        <h1>Register</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="username">
            Username:
            <FontAwesomeIcon
              icon={faCheck}
              className={validName ? "valid" : "hide"}
            />
            <FontAwesomeIcon
              icon={faTimes}
              className={
                validName || !user ? "hide" : "invalid"
              }
            />
          </label>
          <input
            type="text"
            id="username"
            ref={userRef}
            autoComplete="off"
            onChange={(e) => setUser(e.target.value)}
            value={user}
            required
            aria-invalid={validName ? "false" : "true"}
            aria-describedby="uidnote"
            onFocus={() => setUserFocus(true)}
            onBlur={() => setUserFocus(false)}
          />
          <p
            id="uidnote"
            className={
              userFocus && user && !validName
                ? "instructions"
                : "offscreen"
            }
          >
            <FontAwesomeIcon icon={faInfoCircle} />
            4 to 24 characters.
            <br />
            Must begin with a letter.
            <br />
            Letters, numbers, underscores, hyphens allowed.
          </p>
          <label htmlFor="email">
            E-mail:
            <FontAwesomeIcon
              icon={faCheck}
              className={validName ? "valid" : "hide"}
            />
            <FontAwesomeIcon
              icon={faTimes}
              className={
                validName || !user ? "hide" : "invalid"
              }
            />
          </label>
          <input
            type="email"
            id="email"
            ref={emailRef}
            autoComplete="off"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
            aria-invalid={validName ? "false" : "true"}
            aria-describedby="uidnote"
            onFocus={() => setEmailFocus(true)}
            onBlur={() => setEmailFocus(false)}
          />
          <p
            id="uidnote"
            className={
              emailFocus && email
                ? "instructions"
                : "offscreen"
            }
          >
            <FontAwesomeIcon icon={faInfoCircle} />
            4 to 24 characters.
            <br />
            Must begin with a letter.
            <br />
            Letters, numbers, underscores, hyphens allowed.
          </p>
          <label htmlFor="password">
            Password:
            <FontAwesomeIcon
              icon={faCheck}
              className={validPwd ? "valid" : "hide"}
            />
            <FontAwesomeIcon
              icon={faTimes}
              className={
                validPwd || !pwd ? "hide" : "invalid"
              }
            />
          </label>
          <input
            type="password"
            id="password"
            onChange={(e) => setPwd(e.target.value)}
            value={pwd}
            required
            aria-invalid={validPwd ? "false" : "true"}
            aria-describedby="pwdnote"
            onFocus={() => setPwdFocus(true)}
            onBlur={() => setPwdFocus(false)}
          />
          <p
            id="pwdnote"
            className={
              pwdFocus && !validPwd
                ? "instructions"
                : "offscreen"
            }
          >
            <FontAwesomeIcon icon={faInfoCircle} />
            8 to 24 characters.
            <br />
            Must include uppercase and lowercase letters, a
            number and a special character.
            <br />
            Allowed special characters:{" "}
            <span aria-label="exclamation mark">
              !
            </span>{" "}
            <span aria-label="at symbol">@</span>{" "}
            <span aria-label="hashtag">#</span>{" "}
            <span aria-label="dollar sign">$</span>{" "}
            <span aria-label="percent">%</span>
          </p>
          <label htmlFor="confirm_pwd">
            Confirm Password:
            <FontAwesomeIcon
              icon={faCheck}
              className={
                validMatch && matchPwd ? "valid" : "hide"
              }
            />
            <FontAwesomeIcon
              icon={faTimes}
              className={
                validMatch || !matchPwd ? "hide" : "invalid"
              }
            />
          </label>
          <input
            type="password"
            id="confirm_pwd"
            onChange={(e) => setMatchPwd(e.target.value)}
            value={matchPwd}
            required
            aria-invalid={validMatch ? "false" : "true"}
            aria-describedby="confirmnote"
            onFocus={() => setMatchFocus(true)}
            onBlur={() => setMatchFocus(false)}
          />
          <p
            id="confirmnote"
            className={
              matchFocus && !validMatch
                ? "instructions"
                : "offscreen"
            }
          >
            <FontAwesomeIcon icon={faInfoCircle} />
            Must match the first password input field.
          </p>
          <button
            disabled={
              !validName || !validPwd || !validMatch
                ? true
                : false
            }
          >
            Sign Up
          </button>
        </form>
        <p>
          Already registered?
          <br />
          <span className="line">
            {/*put router link here*/}
            {/* <a href="#">Sign In</a> */}
          </span>
        </p>
      </section>
    </>
  );
}

export default Signup_form