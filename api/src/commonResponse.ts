import { Response } from "express";

export const serverErrorHandler = (
        err: Error, 
        res: Response, 
        location: string,
        err_msgs: string[]=[]
    ) => {
    console.warn(err);
    err_msgs.length && console.warn(err_msgs)
    console.log(`The error above occured at: ${location}`)
    return res.status(500).json({
        message: "An internal server error occured", 
        errors: ["An internal server error occured"].push(...err_msgs)
    })
}
