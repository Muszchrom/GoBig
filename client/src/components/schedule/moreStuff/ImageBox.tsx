import { useState, useEffect } from "react"
import ImageInput, { ImageInputLoading } from "../../forms/ImageInput"
import { getImage } from "../../Requests"
import { GroupState } from "../AdditionalInfo"

export default function ImageBox({groupState}: {groupState: GroupState["groupState"]}) {
    const [image, setImage] = useState("")
    const [loading, setLoading] = useState(true)
  
    useEffect(() => {
      (async () => {
        const image = await getImage()
        if (image.status !== 200) return setLoading(false)
        const imgblob = await image.blob()
        setImage(URL.createObjectURL(imgblob))
        setLoading(false)
      })()
    }, [])
  
    return (<>
        {loading
          ? <ImageInputLoading>Campus map</ImageInputLoading>
          : <ImageInput imageSrc={image} setImageSrc={setImage} disabled={!(groupState.privileges <= 1)}>Campus map</ImageInput>}
    </>) 
  }