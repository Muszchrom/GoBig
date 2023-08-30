import { signOut } from "../components/Requests";

export default function SignOut({setSignedIn}) {
    (async () => {
        await signOut()
        setSignedIn(false)
    })()
    return (<>Signing out...</>)
}