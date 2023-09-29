import { signOut } from "../components/Requests";

export default function SignOut({setSignedIn}: {setSignedIn: (val: boolean) => void}) {
    (async () => {
        await signOut()
        setSignedIn(false)
    })()
    return (<>Signing out...</>)
}