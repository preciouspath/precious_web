const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
const { body, validationResult, header } = require("express-validator");
const _ = require("underscore");
const moment = require("moment");
const UserSchema = require("../../schema/userSchema");
const TemplateSchema = require("../../schema/TemplateSchema");
const CustomerTypeSchema = require("../../schema/customerTypeSchema");
const IntroSchema = require("../../schema/introSchema");
const contactUsSchema = require("../../schema/contactUsSchema");
const SettingSchema = require("../../schema/globalSettingSchema");
const { I18n } = require("i18n");
const i18n = new I18n();
const { ObjectId } = require("mongodb");
const roleId = "customer";
const Auth = require("../../middleware/authenticate");
const commonHelper = require("../../helper/function");
const mailSend = require("../../helper/mailer");
const multer = require("multer");
const messages_th = require("../../helper/apiMessages/apimessages_th");
const messages_en = require("../../helper/apiMessages/apiMessages_en");
const HelpSchema = require("../../schema/HelpSchema");
const servicesSchema = require("../../schema/servicesSchema");
const itemsSchema = require("../../schema/itemsSchema");
const itemSize = require("../../schema/itmeSizeSchema");
const appHomeSlider = require("../../schema/appHomeSlider");
const homeAboutUsSchema = require("../../schema/homeAboutUsSchema");
const globalSettingSchema = require("../../schema/globalSettingSchema");
const AddressSchema = require("../../schema/AddressSchema");
const CitySchema = require("../../schema/CitySchema");
const StateSchema = require("../../schema/StateSchema");
const AreaSchema = require("../../schema/AreaSchema");
const FaqSchema = require("../../schema/faqSchema");
const cmspageSchema = require("../../schema/cmsPagesSchema");
const AboutUsSchema = require("../../schema/AboutUsSchema");
const AddOnServiceSchema = require("../../schema/addOnServiceSchema");
const OurServicesSchema = require("../../schema/OurServicesSchema");
const subscriptionSchema = require("../../schema/subscriptionSchema");
const offerSchema = require("../../schema/offerPromotionSchema");
const orderNoteSchema = require("../../schema/orderNoteSchema");
const unitSchema = require("../../schema/unitSchema");
const placedOrderSchema = require("../../schema/placedOrderSchema");
const CancelOrdersSchema = require("../../schema/CancelOrdersSchema");
const ReasonList = require("../../schema/reasonSchema");
const QRCode = require("qrcode");
const ExamineSchema = require("../../schema/ExamineSchema");
const VanSchema = require("../../schema/VanSchema");
const QRcodeSchema = require("../../schema/QRcodeSchema");
const RateReviewSchema = require("../../schema/Rate&ReviewSchema");
const RaiseAndIssuesSchema = require("../../schema/Raise&issuesSchema");
const DropOffImageSchema = require("../../schema/DropOffImageSchema");
const BuyPackageSchema = require("../../schema/BuyPackageSchema");
const NoteRemarkSchema = require("../../schema/NoteRemarkSchema");
const examinItemSchema = require("../../schema/ExamineSchema");
const PackageHistorySchema = require("../../schema/PackageHistorySchema");
const offerPromotionSchema = require("../../schema/offerPromotionSchema");
const RemainingServiceQuotaSchema = require("../../schema/RemainingServiceQuotaSchema");
const { checkPrimeSync } = require("crypto");
const chatSchema = require("../../schema/chatSchema");
const { truncate } = require("fs/promises");
const NotificationSchema = require("../../schema/NotificationSchema");
const offlineOrderSchema = require("../../schema/offlineOrderSchema");
const colorSchema = require("../../schema/colorSchema");
const SubscriptionDurationSchema = require("../../schema/subscribeDurationSchema");
const addOnServiceSchema = require("../../schema/addOnServiceSchema");
const BulkOrderQRcodeSchema = require("../../schema/BulkOrderQRcodeSchema");
const BagSchema = require("../../schema/BagSchema");
const http = require("http");
const TransactionSchema = require("../../schema/TransactionSchema");
const serviceProcessSchema = require("../../schema/serviceProcessSchema");
const userSchema = require("../../schema/userSchema");
const omise = require("omise")({
    // Test
    secretKey: process.env.Omise_privateKey,
    publicKey: process.env.Omise_publicKey,
    // Live
    // secretKey: "skey_64em1meaqidybr35kte",
    // publicKey: "pkey_5whmi6mdqk9c85kkt33",
});
async function getOrCreateOmiseCustomer(userId) {
    const user = await UserSchema.findById(userId);
    if (!user) throw new Error("User not found in database");

    let customerId = user.omiseCustomerId;

    if (customerId) {
        try {
            const customer = await omise.customers.retrieve(customerId);
            if (customer && !customer.deleted) {
                return customer;
            }
        } catch (error) {
            if (error.code !== 'not_found') throw error;
            console.log(`Omise customer ${customerId} not found in Omise environment for user ${userId}. Re-creating...`);
        }
    }

    // Create new customer if not exists or if previous one was not found
    const newCustomer = await omise.customers.create({
        email: user.email.toLowerCase(),
        description: `Customer for user ${user._id} (auto-created/re-created)`
    });

    await UserSchema.findByIdAndUpdate(userId, { omiseCustomerId: newCustomer.id });
    console.log(`Successfully created/re-linked Omise customer ${newCustomer.id} for user ${user._id}`);
    return newCustomer;
}
const storage = multer.diskStorage({
    destination: "./images",
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});
const upload = multer({ storage: storage });
//(App api start with) localhost:3006/auth/api
//CUSTOMER APP API START HERE
// Sign in
router.post("/signin", async (req, res) => {
    try {
        const lang = req.get("Accept-Language");
        const messages = lang == 1 ? messages_en : messages_th;
        const { mobile, email, password, fcmToken } = req.body;
        const loginWithMobile = !!mobile;
        const user = await UserSchema.findOne({
            ...(loginWithMobile ? { mobile } : { email: email.toLowerCase() }),
            role: "customer",
            isDelete: false,
        }).lean();
        if (!user) {
            return res.send({ status: false, message: messages?.recordNotFound, data: {} });
        }
        if (user.status !== 1) {
            return res.send({ status: false, message: "Your account has been suspended.", data: {} });
        }
        if (loginWithMobile) {
            return handleMobileLogin(user, messages, res, fcmToken);
        } else {
            return handleEmailLogin(user, password, fcmToken, messages, res);
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send({ status: false, message: "Internal server error", error: err.message });
    }
});

async function handleMobileLogin(user, messages, res, fcmToken) {
    const otp = commonHelper.generateOTP();
    const updatedUser = await UserSchema.findOneAndUpdate(
        { mobile: user.mobile, isDelete: false },
        { otp, otpStatus: true, loginWith: "phone", FCMToken: fcmToken },
        { new: true }
    );
    if (!updatedUser) {
        return res.send({ status: false, message: messages?.recordNotFound, data: {} });
    }
    await commonHelper.sendOTP({ mobile: user.mobile, message: `Your account signin OTP is ${otp}` });
    if (!user.emailVerify) {
        return res.send({ status: true, message: messages?.accountNotVerify, data: {} });
    }
    return res.send({ status: true, message: messages?.otpSentOnMobile, data: { otp } });
}
async function handleEmailLogin(user, password, fcmToken, messages, res) {
    const isPasswordCorrect = bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) {
        return res.send({ status: false, message: messages?.passwordNotMatch });
    }
    if (!user.emailVerify) {
        const otp = await sendMail(user.email, "customer", "otp-verify-signup");
        await UserSchema.updateOne(
            { _id: user._id },
            { FCMToken: fcmToken }
        );
        return res.send({
            status: true,
            message: messages?.accountNotVerify,
            data: {},
            otp,
        });
    }

    const updatedUser = await UserSchema.findOneAndUpdate(
        { email: user.email, isDelete: false },
        { loginWith: "email", FCMToken: fcmToken },
        { new: true }
    ).lean();
    updatedUser.address = await AddressSchema.findOne({
        user_id: user._id,
        default: "1",
        isDelete: false,
    });
    updatedUser.package = await getUserCurrentPackage(user._id);
    const token = jwt.sign({ _id: user._id }, process.env.privateKey);
    return res.status(200).send({
        status: true,
        message: messages?.loginSuccessfull,
        data: updatedUser,
        token,
        imageUrl: process.env.ImageUrl,
    });
}

async function getUserCurrentPackage(userId) {
    return await BuyPackageSchema.aggregate([
        { $match: { userId, subscriptionActive: true } },
        {
            $lookup: {
                from: "subscriptions",
                localField: "packageId",
                foreignField: "_id",
                pipeline: [
                    {
                        $lookup: {
                            from: "offer&promotions",
                            localField: "_id",
                            foreignField: "package_id",
                            as: "offer&promotions",
                        },
                    },
                ],
                as: "packageId",
            },
        },
    ]);
}

// forget password
router.post("/forgot-password", [body("email").exists().withMessage({
    message: "Please send email",
}),], async (req, res) => {
    const lang = req?.get("Accept-Language");
    const messages = lang == 1 ? messages_en : messages_th;
    // For Error
    const errors = validationResult(req);
    if (!errors?.isEmpty()) {
        return res?.status(200)?.json({
            status: false,
            message: errors.errors[0].msg.message,
            data: {},
        });
    }
    UserSchema?.findOne({ email: req?.body?.email?.toLowerCase(), role: req.body.role, isDelete: false }, async (err, result) => {
        if (err) throw err;
        if (!result) {
            let response = {
                status: false,
                message: messages?.recordNotFound,
                data: {},
            };
            return res?.send(response);
        } else {
            const resp = await sendMail(
                req?.body?.email?.toLowerCase(),
                req.body.role,
                "forgot-password"
            );
            commonHelper.sendOTP({
                mobile: req?.body?.mobile,
                message: "Forget your account verification otp " + resp
            })
            // console.log(resp);
            let response = {
                status: true,
                message: messages?.otpSent,
                data: resp,
            };
            return res?.send(response);
            // let otp = commonHelper.generateOTP();
            // UserSchema.findOneAndUpdate(
            //   { email: req.body.email.toLowerCase() },
            //   { otp: otp, otpStatus: true },
            //   { new: true },
            //   async (err, user) => {
            //     if (err) throw err;
            //     let template = await TemplateSchema.findOne({ slug: "forgot-password" });
            //     template.description = template.description.replace("{otp}", otp);
            //     let mailData = {
            //       email: user.email,
            //       subject: template.title,
            //       html: template.description,
            //     };
            //     mailSend(mailData);
            //     let response = {
            //       status: true,
            //       message: "Please Check Otp Send To Email Address",
            //       data: { mailData },
            //     };
            //     res.send(response);
            //   }
            // );
        }
    }
    );
}
);
// OTP Vrification
router.post(
    "/verifyForgetOTP",
    [
        body("email").exists().withMessage({
            message: "Please enter email",
        }),
        body("otp").exists().withMessage({
            message: "Please enter otp",
        }),
    ],
    async (req, res) => {
        const lang = req?.get("Accept-Language");
        const messages = lang == 1 ? messages_en : messages_th;

        // For Error
        const errors = validationResult(req);
        if (!errors?.isEmpty()) {
            return res?.status(200)?.json({
                status: false,
                message: errors?.errors[0]?.msg?.message,
                data: {},
            });
        }
        let updateData = {
            otp: null,
            otpStatus: false,
            emailVerify: true,
        };
        UserSchema?.findOneAndUpdate(
            {
                email: req?.body?.email?.toLowerCase(),
                otp: req?.body?.otp,
                isDelete: false,
            },
            updateData,
            (err, result) => {
                if (err) throw err;
                if (!result) {
                    let response = {
                        status: false,
                        message: messages?.invalidOtp,
                        data: {},
                    };
                    return res?.send(response);
                } else {
                    let response = {
                        status: true,
                        message: messages?.otpVerifySuccessfully,
                        data: result?._id,
                    };
                    return res?.send(response);
                }
            }
        );
    }
);
// Registration
router.post("/signup", [body("username")
    .exists()
    .withMessage({ message: "Please enter User Name", })
    .isLength({ min: 3 })
    .withMessage({ message: "Must be minimum 3 character", }),
body("email")
    .exists()
    .withMessage({ message: "Please enter email", })
    .isEmail()
    .withMessage({ message: "Please enter valid email", }),
body("mobile")
    .exists()
    .withMessage({ message: "Please enter mobile no", })
    .isNumeric()
    .withMessage({ message: "Please enter valid mobile no", }),
body("password").exists().withMessage({ message: "Please enter password" }),], async (req, res) => {
    // For Error
    try {
        const lang = req?.get("Accept-Language");
        const messages = lang == 1 ? messages_en : messages_th;
        const errors = validationResult(req);
        if (!errors?.isEmpty()) {
            return res?.status(200)?.json({
                status: false,
                message: errors?.errors[0]?.msg?.message,
                data: {},
            });
        }
        // agr user refer code k sth aata h tho
        let getReferralData = null;
        const getRewardPonit = await globalSettingSchema.findOne(
            {},
            { refer_user_point: 1, referral_user_point: 1 }
        );
        if (req?.body?.referral_code) {
            getReferralData = await UserSchema.findOne({
                referral_code: req?.body?.referral_code,
            });
            const updateObj = {
                reward_point: getRewardPonit.refer_user_point,
            };
            await UserSchema.findByIdAndUpdate(getReferralData?._id, updateObj, {
                new: true,
            });
        }
        const result = Math.random().toString(36).substring(2, 7);
        let temp = {
            username: req?.body?.username,
            email: req?.body?.email?.toLowerCase(),
            mobile: req?.body?.mobile,
            password: bcrypt.hashSync(req?.body?.password, salt),
            tourist: req?.body?.tourist,
            role: roleId,
            referral_code: result,
            referral_id: req?.body?.referral_code == undefined ? null : getReferralData?._id,
            reward_point: req?.body?.referral_code == undefined ? 0 : getRewardPonit.referral_user_point,
        };
        //is exist apply
        const newUser = new UserSchema(temp);
        let isExist = await UserSchema?.find({
            mobile: req?.body?.mobile,
            isDelete: false,
        });
        if (isExist[0]?.otp != null && isExist[0]?.otpStatus == true && isExist[0]?.emailVerify == false) {
            const resp = await sendMail(
                req?.body?.email?.toLowerCase(),
                isExist[0]?.role,
                "otp-verify-signup"
            );
            commonHelper.sendOTP({
                mobile: req?.body?.mobile,
                message: "Your account verification otp " + isExist[0]?.otp
            })
            let response = {
                status: true,
                message: "Please check your email and verify your account",
            };
            return res?.send(response);
        }
        if (isExist.length == 0) {
            const getUser = await UserSchema.findOne({ email: req.body.email.toLowerCase(), isDelete: false })
            if (!getUser) {
                newUser?.save(async (err, doc) => {
                    if (err) {
                        let response = { status: false, message: err?.message, data: {} };
                        return res?.send(response);
                    }
                    if (doc) {
                        const customer = await omise.customers.create({
                            email: req?.body?.email?.toLowerCase(),
                            description: "create new customer"
                        });
                        const omiseCustomer = await UserSchema.findOneAndUpdate({ _id: doc._id, email: req?.body?.email?.toLowerCase() }, { omiseCustomerId: customer?.id })
                        const resp = await sendMail(
                            req?.body?.email?.toLowerCase(),
                            doc.role,
                            "otp-verify-signup"
                        );
                        commonHelper.sendOTP({
                            mobile: req?.body?.mobile,
                            message: "Your account verification otp " + doc?.otp
                        })
                        let response = {
                            status: true,
                            message: messages?.signUpSuccessfull,
                            data: resp,
                        };
                        return res?.send(response);
                    } else {
                        let response = {
                            status: false,
                            message: messages?.errorMessage,
                            data: {},
                        };
                        return res?.send(response);
                    }
                });
            } else {
                const customer = await UserSchema.findOneAndUpdate({ mobile: req?.body?.mobile?.toLowerCase() }, {
                    password: temp.password,
                    mobile: req.body.mobile,
                    username: req?.body?.username,
                    tourist: req?.body?.tourist,
                    role: roleId,
                    referral_code: result,
                    referral_id: req?.body?.referral_code == undefined ? null : getReferralData?._id,
                    reward_point: req?.body?.referral_code == undefined ? 0 : getRewardPonit.referral_user_point,
                })
                const resp = await sendMail(
                    req?.body?.email?.toLowerCase(),
                    roleId,
                    "otp-verify-signup"
                );
                let response = {
                    status: true,
                    message: messages?.signUpSuccessfull,
                    data: customer,
                };
                return res?.send(response);
            }
        } else {
            let response = {
                status: false,
                message: "This number is already in use",
            };
            return res?.send(response);
        }
    } catch (error) {
        console.log({ error });
        let response = {
            status: false,
            message: "Server Error",
        };
        return res?.send(response);
    }
}
);
// OTP Verification
router.post(
    "/verifyEmailOTP",
    [
        body("email").exists().withMessage({
            message: "Please enter email",
        }),
        body("otp").exists().withMessage({
            message: "Please enter otp",
        }),
    ],
    async (req, res) => {
        // console.log(req.body)
        const lang = req?.get("Accept-Language");
        const messages = lang == 1 ? messages_en : messages_th;

        // For Error
        const errors = validationResult(req);
        if (!errors?.isEmpty()) {
            return res?.status(200).json({
                status: false,
                message: errors?.errors[0]?.msg?.message,
                data: {},
            });
        }
        UserSchema?.findOne(
            { email: req?.body?.email?.toLowerCase(), otp: req?.body?.otp },
            (err, result) => {
                // console.log(result, "errrrrrrrrrrrrrr")
                if (err) throw err;
                if (!result) {
                    let response = {
                        status: false,
                        message: messages?.invalidOtp,
                        data: {},
                    };
                    return res?.send(response);
                } else {
                    let updateData = {
                        otp: null,
                        otpStatus: false,
                        emailVerify: true,
                    };
                    jwt.sign(
                        { _id: result?._id },
                        process?.env?.privateKey,
                        (err, token) => {
                            // console.log("error", err);
                            if (err) {
                                let response = {
                                    status: true,
                                    message: messages?.otpVerifySuccessfully,
                                    data: {},
                                };
                                return res?.send(response);
                            } else {
                                UserSchema?.findOneAndUpdate(
                                    { email: req?.body?.email?.toLowerCase(), isDelete: false },
                                    updateData,
                                    { new: true },
                                    async (err, user) => {
                                        if (err) throw err;
                                        if (user) {
                                            let response = {
                                                status: true,
                                                message: messages?.loginSuccessfull,
                                                data: user,
                                                token: token,
                                                imageUrl: process?.env?.ImageUrl,
                                            };
                                            return res?.send(response);
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            }
        );
    }
);
// mobile otp verify
router.post(
    "/verifyMobileOTP",
    [
        body("mobile").exists().withMessage({
            message: "Please send mobile",
        }),
        body("otp").exists().withMessage({
            message: "Please send otp",
        }),
    ],
    async (req, res) => {
        const lang = req?.get("Accept-Language");
        const messages = lang == 1 ? messages_en : messages_th;
        const errors = validationResult(req);
        if (!errors?.isEmpty()) {
            return res?.status(200)?.json({
                status: false,
                message: errors?.errors[0]?.msg.message,
                data: {},
            });
        }
        UserSchema?.findOne(
            {
                mobile: req?.body?.mobile,
                otp: req?.body?.otp,
                isDelete: false,
            },
            async (err, result) => {
                if (err) throw err;
                if (!result) {
                    let response = {
                        status: false,
                        message: messages?.invalidOtp,
                        data: {},
                    };
                    return res?.send(response);
                } else {
                    let updateData = {
                        otp: null,
                        otpStatus: false,
                        emailVerify: true,
                    };
                    await UserSchema?.findOneAndUpdate(
                        { mobile: req?.body?.mobile, otp: req?.body?.otp, isDelete: false },
                        { FCMToken: req?.body?.FCMToken },
                        { new: true }
                    );
                    jwt?.sign(
                        { _id: result?._id },
                        process?.env?.privateKey,
                        (err, token) => {
                            if (err) {
                                let response = {
                                    status: true,
                                    message: messages?.otpVerifySuccessfully,
                                    data: {},
                                };
                                return res?.send(response);
                            } else {
                                UserSchema?.findOneAndUpdate(
                                    { mobile: req?.body?.mobile, isDelete: false },
                                    updateData,
                                    { new: true },
                                    async (err, user) => {
                                        if (err) throw err;
                                        if (user) {
                                            let response = {
                                                status: true,
                                                message: messages?.loginSuccessfull,
                                                data: user,
                                                token: token,
                                                imageUrl: process?.env?.ImageUrl,
                                            };
                                            return res?.send(response);
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            }
        );
    }
);
// Resend OTP Verification
router.post("/resendOTP", async (req, res) => {
    const lang = req?.get("Accept-Language");
    const messages = lang == 1 ? messages_en : messages_th;
    const errors = validationResult(req);
    if (!errors?.isEmpty()) {
        return res?.status(200)?.json({
            status: false,
            message: errors.errors[0].msg.message,
            data: {},
        });
    }
    const con = {
        $or: [
            { mobile: req?.body?.mobile },
            { email: req?.body?.email?.toLowerCase() },
        ],
        isDelete: false,
    };
    if (req?.body?.mobile) {
        UserSchema?.findOne({ mobile: req?.body?.mobile, isDelete: false }, async function (err, data) {
            if (err) throw err;
            if (!data) {
                let response = {
                    status: false,
                    message: messages?.recordNotFound,
                    data: {},
                };
                return res?.send(response);
            } else {
                if (data?.status == 1) {
                    if (req?.body?.mobile) {
                        let otp = commonHelper.generateOTP();
                        // let otp = "123456";
                        UserSchema?.findOneAndUpdate(
                            { mobile: req?.body?.mobile, isDelete: false },
                            {
                                otp: otp,
                                otpStatus: true,
                            },
                            async (err, user) => {
                                if (err) throw err;
                                if (user) {
                                    commonHelper.sendOTP({
                                        mobile: user.mobile,
                                        message: "Your account verification otp " + otp
                                    })
                                    let response = {
                                        status: true,
                                        message: "OTP sent again on mobile no",
                                        data: {},
                                        otp: { otp },
                                    };
                                    return res?.send(response);
                                }
                            }
                        );
                    } else {
                        if (req?.body?.email) {
                            const resp = await sendMail(
                                req?.body?.email?.toLowerCase(),
                                data.role,
                                "otp-verify-signup"
                            );
                            let response = {
                                status: true,
                                message: messages?.emailOTPResend,
                                data: {},
                                otp: resp,
                            };
                            return res?.send(response);
                        }
                    }
                } else {
                    return res?.send(errorResponse(messages?.accountDeactivate));
                }
            }
        });
    } else {
        UserSchema?.findOne({ email: req?.body?.email?.toLowerCase(), isDelete: false }, async function (err, data) {
            if (err) throw err;
            if (!data) {
                let response = {
                    status: false,
                    message: messages?.recordNotFound,
                    data: {},
                };
                return res?.send(response);
            } else {
                if (data?.status == 1) {
                    if (req?.body?.mobile) {
                        let otp = commonHelper.generateOTP();
                        // let otp = "123456";
                        UserSchema?.findOneAndUpdate(
                            { mobile: req?.body?.mobile, isDelete: false },
                            {
                                otp: otp,
                                otpStatus: true,
                            },
                            async (err, user) => {
                                if (err) throw err;
                                if (user) {
                                    commonHelper.sendOTP({
                                        mobile: user.mobile,
                                        message: "Your account verification otp " + otp
                                    })
                                    let response = {
                                        status: true,
                                        message: "OTP sent again on mobile no",
                                        data: {},
                                        otp: { otp },
                                    };
                                    return res?.send(response);
                                }
                            }
                        );
                    } else {
                        if (req?.body?.email) {
                            const resp = await sendMail(
                                req?.body?.email?.toLowerCase(),
                                data.role,
                                "otp-verify-signup"
                            );
                            let response = {
                                status: true,
                                message: messages?.emailOTPResend,
                                data: {},
                                otp: resp,
                            };
                            return res?.send(response);
                        }
                    }
                } else {
                    return res?.send(errorResponse(messages?.accountDeactivate));
                }
            }
        });
    }

    // const resp = await sendMail(
    //   req.body.email.toLowerCase(),
    //   "otp-verify-signup"
    // );
    // let response = {
    //   status: true,
    //   message: messages.emailOTPResend,
    //   data: resp,
    // };
    // res.send(response);
});
// Introduction
router.get("/get-intro", async (req, res) => {
    const lang = req?.get("Accept-Language");
    const messages = lang == 1 ? messages_en : messages_th;
    const introData = await IntroSchema?.find();
    if (introData) {
        let response = {
            status: true,
            message: (lang == 1 && "Intro data are here") || "ข้อมูลแนะนำอยู่ที่นี่",
            data: introData,
            imageUrl: process?.env?.ImageUrl,
        };
        return res?.send(response);
    } else {
        let response = {
            status: false,
            message: messages?.errorMessage,
        };
        return res?.send(response);
    }
});
//GET HELP FOR CUSTOMER
router.get("/help", async (req, res) => {
    const lang = req.get("Accept-Language");
    const messages = lang == 1 ? messages_en : messages_th;
    try {
        const result = await HelpSchema?.find({ isDelete: false });
        if (result) {
            const response = {
                status: true,
                data: result,
                imageUrl: process?.env?.ImageUrl,
            };
            return res?.json(response);
        }
    } catch (error) {
        const response = { status: false, message: messages?.errorMessage };
        return res?.json(response);
    }
});
//HOME PAGE FOR CUSTOMER APP
router.get("/home", async (req, res) => {
    try {
        const [aboutUs, sliders, globalSetting, services] = await Promise.all([
            homeAboutUsSchema?.find({ status: 1 }).select("-__v -isDelete"),
            appHomeSlider?.find({ status: 1 }).select("-__v -isDelete"),
            globalSettingSchema?.find(
                {},
                {
                    home_title_aboutUs_EN: 1,
                    home_title_aboutUs_TH: 1,
                    regularTitle_EN: 1,
                    regularTitle_TH: 1,
                    regularSubTitle_EN: 1,
                    regularSubTitle_TH: 1,
                    regularImage: 1,
                    packageTitle_EN: 1,
                    packageTitle_TH: 1,
                    packageSubTitle_EN: 1,
                    packageSubTitle_TH: 1,
                    packageImage: 1,
                    how_to_use_our_service_imageEN: 1,
                    how_to_use_our_service_imageTH: 1,
                    place_order_imageEN: 1,
                    place_order_imageTH: 1,
                    feactoryLaundryClosed: 1
                }
            ),
            servicesSchema.aggregate([
                {
                    $match: { status: 1 },
                },
                {
                    $lookup: {
                        from: "items",
                        localField: "item",
                        foreignField: "_id",
                        as: "items",
                    },
                    $lookup: {
                        from: "units",
                        localField: "unit",
                        foreignField: "_id",
                        as: "units",
                    },
                },
            ]),
        ]);
        const response = {
            status: true,
            message: "",
            data: {
                sliders: sliders,
                services: services,
                aboutUs: aboutUs,
                globalSetting: globalSetting,
                imageUrl: process.env.ImageUrl,
            },
        };
        return res.send(response);
    } catch (error) {
        const response = { status: false, message: error?.message };
        res.json(response);
    }
});
//VAN DRIVER LOGIN API
router.post("/driver-signin", async function (req, res) {
    const role = commonHelper?.getRole();
    const lang = req?.get("Accept-Language");
    const messages = lang == 1 ? messages_en : messages_th;
    const con = {
        $or: [
            { mobile: req?.body?.mobile },
            { email: req?.body?.email?.toLowerCase() },
        ],
        isDelete: false,
    };
    if (req?.body?.mobile) {
        UserSchema?.findOne({ mobile: req?.body?.mobile, role: "driver", isDelete: false }, async function (err, data) {
            if (err) throw err;
            if (!data) {
                let response = {
                    status: false,
                    message: messages?.recordNotFound,
                    data: {},
                };
                return res?.send(response);
            } else {
                if (data?.status == 1) {
                    if (req?.body?.mobile) {
                        // let otp = commonHelper.generateOTP();
                        let otp = "123456";
                        UserSchema?.findOneAndUpdate(
                            { mobile: req?.body?.mobile, role: "driver", isDelete: false },
                            {
                                otp: otp,
                                otpStatus: true,
                            },
                            async (err, user) => {
                                if (err) throw err;
                                if (user) {
                                    let response = {
                                        status: true,
                                        message: messages?.otpSentOnMobile,
                                        data: { otp },
                                    };
                                    return res?.send(response);
                                }
                            }
                        );
                    } else {
                        if (bcrypt?.compareSync(req?.body?.password, data?.password)) {
                            if (!data?.emailVerify) {
                                const resp = await sendMail(
                                    req?.body?.email?.toLowerCase(),
                                    "driver",
                                    "otp-verify-signup"
                                );
                                if (req.body.mobile) {
                                    commonHelper.sendOTP({
                                        mobile: req?.body?.mobile,
                                        message: "Your account verification otp " + resp
                                    })
                                }
                                let response = {
                                    status: true,
                                    message: messages?.accountNotVerify,
                                    data: {},
                                    otp: resp,
                                };
                                return res?.send(response);
                            } else {
                                const updateObj = {
                                    FCMToken: req?.body?.FCMToken,
                                };
                                await UserSchema?.findOneAndUpdate({ email: req?.body?.email?.toLowerCase(), role: "driver" }, updateObj, { new: true });
                                jwt?.sign(
                                    { _id: data?._id },
                                    process?.env?.privateKey,
                                    function (err, token) {
                                        if (err) console.log(err);
                                        let response = {
                                            status: true,
                                            message: messages?.loginSuccessfull,
                                            data: data,
                                            token: token,
                                            imageUrl: process?.env?.ImageUrl,
                                        };
                                        return res?.send(response);
                                    }
                                );
                            }
                        } else {
                            let response = {
                                status: false,
                                message: messages?.passwordNotMatch,
                            };
                            return res?.send(response);
                        }
                    }
                } else {
                    return res?.json({ message: messages?.accountDeactivate });
                }
            }
        });
    } else {
        UserSchema?.findOne({ email: req?.body?.email.toLowerCase(), role: "driver", isDelete: false }, async function (err, data) {
            if (err) throw err;
            if (!data) {
                let response = {
                    status: false,
                    message: messages?.recordNotFound,
                    data: {},
                };
                return res?.send(response);
            } else {
                if (data?.status == 1) {
                    if (req?.body?.email && (!data?.emailVerify)) {
                        // console.log("mobile");
                        // let otp = commonHelper.generateOTP();
                        let otp = "123456";
                        UserSchema?.findOneAndUpdate(
                            { email: req?.body?.email.toLowerCase(), role: "driver" },
                            {
                                otp: otp,
                                otpStatus: true,
                            },
                            async (err, user) => {
                                if (err) throw err;
                                if (user) {
                                    let response = {
                                        status: true,
                                        message: messages?.otpSentOnMobile,
                                        data: { otp },
                                    };
                                    return res?.send(response);
                                }
                            }
                        );
                    } else {
                        if (bcrypt?.compareSync(req?.body?.password, data?.password)) {
                            if (!data?.emailVerify) {
                                const resp = await sendMail(
                                    req?.body?.email?.toLowerCase(),
                                    "driver",
                                    "otp-verify-signup"
                                );
                                if (req.body.mobile) {
                                    commonHelper.sendOTP({
                                        mobile: req?.body?.mobile,
                                        message: "Your account verification otp " + resp
                                    })
                                }
                                let response = {
                                    status: true,
                                    message: messages?.accountNotVerify,
                                    data: {},
                                    otp: resp,
                                };
                                return res?.send(response);
                            } else {
                                const updateObj = {
                                    FCMToken: req?.body?.FCMToken,
                                };
                                await UserSchema?.findOneAndUpdate(
                                    { email: req?.body?.email?.toLowerCase(), role: "driver", isDelete: false },
                                    updateObj,
                                    { new: true }
                                );
                                jwt?.sign(
                                    { _id: data?._id },
                                    process?.env?.privateKey,
                                    function (err, token) {
                                        if (err) console.log(err);
                                        let response = {
                                            status: true,
                                            message: messages?.loginSuccessfull,
                                            data: data,
                                            token: token,
                                            imageUrl: process?.env?.ImageUrl,
                                        };
                                        return res?.send(response);
                                    }
                                );
                            }
                        } else {
                            let response = {
                                status: false,
                                message: messages?.passwordNotMatch,
                            };
                            return res?.send(response);
                        }
                    }
                } else {
                    return res?.json({ message: messages?.accountDeactivate });
                }
            }
        });
    }
});
//RESET PASSWORD
router.post("/reset-password", [body("password").exists().withMessage({
    message: "Please enter password",
}),
body("id").exists().withMessage({
    message: "Please enter id",
}),
], async function (req, res) {
    const lang = req?.get("Accept-Language");
    const messages = lang == 1 ? messages_en : messages_th;
    // For Error
    const errors = validationResult(req);
    if (!errors?.isEmpty()) {
        return res?.status(200).json({
            status: false,
            message: errors?.errors[0]?.msg?.message,
            data: {},
        });
    }
    UserSchema?.findOne({ _id: req?.body?.id }, function (err, result) {
        if (err) throw err;
        if (!result) {
            let response = { status: false, message: "Invalid User", data: {} };
            return res?.send(response);
        } else {
            UserSchema?.findOneAndUpdate(
                { _id: req?.body?.id },
                {
                    password: bcrypt?.hashSync(req?.body?.password, salt),
                    otp: null,
                    otpStatus: false,
                },
                { new: true },
                function (err, user) {
                    if (err) throw err;
                    let response = {
                        status: true,
                        message: messages?.passwordResetSuccessfully,
                        data: {},
                    };
                    return res?.send(response);
                }
            );
        }
    });
}
);
//GET THE CUSTOMER TYPE
router.get("/getcustomer-type", async (req, res) => {
    const data = await CustomerTypeSchema?.find();
    if (data) {
        let response = {
            status: true,
            message: "Cutomer type list is here",
            data: data,
        };
        return res?.send(response);
    } else {
        let response = {
            status: false,
            message: "Oops something wrong please try latter",
        };
        return res?.send(response);
    }
});
//GET CONTACT
router.get("/get-contact", async (req, res) => {
    const contactData = await SettingSchema?.find();
    if (contactData) {
        let response = {
            status: true,
            message: "Contact information is here ",
            data: contactData,
        };
        return res?.send(response);
    } else {
        let response = {
            status: false,
            message: "Oops something wrong please try latter",
        };
        return res?.send(response);
    }
});
router.get("/contact-us", [
    body("fname").exists().withMessage({
        message: "Please enter First Name",
    }),
    body("lname").exists().withMessage({
        message: "Please enter Last Name",
    }),
    body("email")
        .exists()
        .withMessage({
            message: "Please enter email",
        })
        .isEmail()
        .withMessage({
            message: "Please enter valid email",
        }),
    body("message").exists().withMessage({
        message: "Please write some text",
    }),
],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors?.isEmpty()) {
            return res?.status(200)?.json({
                status: false,
                message: errors?.errors[0]?.msg?.message,
                data: {},
            });
        }
        let temp = {
            fname: req?.body?.fname,
            lname: req?.body?.lname,
            email: req?.body?.email?.toLowerCase(),
            mobile: req?.body?.mobile,
            message: req?.body?.message,
        };
        const newContact = new contactUsSchema(temp);
        newContact?.save(async (err, data) => {
            if (err) {
                let response = { status: false, message: err?.message, data: {} };
                return res?.send(response);
            }
            if (data) {
                let response = {
                    status: true,
                    message: "contact information successfully created",
                    data: data,
                };
                return res?.send(response);
            } else {
                let response = {
                    status: false,
                    message: "Oops something wrong please try latter",
                };
                return res?.send(response);
            }
        });
    }
);
// router.get("/package-list", async function (req, res) {
//     try {
//         // console.log("pack list", req.query.subcribe_type);
//         if (req.query.subcribe_type == "1") {
//             const data = await subscriptionSchema
//                 .aggregate([
//                     {
//                         $match: {
//                             subcribe_type: req?.query?.subcribe_type,
//                             isDelete: false,
//                             status: 1,
//                         },
//                     },
//                     {
//                         $lookup: {
//                             from: "services",
//                             foreignField: "_id",
//                             localField: "services",
//                             let: { services: "$services" },
//                             pipeline: [
//                                 {
//                                     $match: {
//                                         $expr: {
//                                             $in: ["$_id", "$$services"],
//                                         },
//                                         $expr: {
//                                             $eq: ["$status", 1],
//                                         },
//                                         $expr: {
//                                             $eq: ["$isDelete", false],
//                                         },
//                                     },
//                                 },
//                                 {
//                                     $lookup: {
//                                         from: "units",
//                                         localField: "unit",
//                                         foreignField: "_id",
//                                         let: { unit: "$unit" },
//                                         pipeline: [
//                                             { $match: { $expr: { $eq: ["$_id", "$$unit"] } } },
//                                         ],
//                                         as: "unit",
//                                     },
//                                 },
//                                 {
//                                     $lookup: {
//                                         from: "items",
//                                         localField: "item",
//                                         foreignField: "_id",
//                                         let: { item: "$item" },
//                                         pipeline: [
//                                             { $match: { $expr: { $in: ["$_id", "$$item"] } } },
//                                             {
//                                                 $lookup: {
//                                                     from: "itemcategories",
//                                                     localField: "itemCategory",
//                                                     foreignField: "_id",
//                                                     let: { itemCategory: "$itemCategory" },
//                                                     pipeline: [
//                                                         {
//                                                             $match: {
//                                                                 $expr: { $eq: ["$_id", "$$itemCategory"] },
//                                                             },
//                                                         },
//                                                     ],
//                                                     as: "itemCategory",
//                                                 },
//                                             },
//                                             {
//                                                 $lookup: {
//                                                     from: "itemsizes",
//                                                     localField: "itemSize",
//                                                     foreignField: "_id",
//                                                     let: { itemSize: "$itemSize" },
//                                                     pipeline: [
//                                                         {
//                                                             $match: { $expr: { $in: ["$_id", "$$itemSize"] } },
//                                                         },
//                                                     ],
//                                                     as: "itemSize",
//                                                 },
//                                             },
//                                         ],
//                                         as: "item",
//                                     },
//                                 },
//                             ],
//                             // pipeline: [
//                             //   { $match: { $expr: { $in: ["$_id", "$$services"] } } },
//                             //   {
//                             //     $lookup: {
//                             //       from: "items",
//                             //       localField: "item",
//                             //       foreignField: "_id",
//                             //       let: { item: "$item" },
//                             //       pipeline: [
//                             //         { $match: { $expr: { $in: ["$_id", "$$item"] } } },
//                             //         { $lookup: {
//                             //           from:"itemcategories",
//                             //           localField:"itemCategory",
//                             //           foreignField:"_id",
//                             //           let:{itemCategory:"$itemCategory"},
//                             //           pipeline:[{$match:{$expr:{$eq:["$_id","$$itemCategory"]}}}],
//                             //           as:"itemCategory"
//                             //         }},
//                             //         {
//                             //           $lookup: {
//                             //             from: "itemsizes",
//                             //             localField: "itemSize",
//                             //             foreignField: "_id",
//                             //             let: { itemSize: "$itemSize" },
//                             //             pipeline: [
//                             //               { $match: { $expr: { $in: ["$_id", "$$itemSize"] } } },
//                             //             ],
//                             //             as: "itemSize",
//                             //           },
//                             //         },
//                             //       ],
//                             //       as: "item",
//                             //     },
//                             //   },
//                             // ],
//                             as: "service",
//                         },
//                     },
//                     {
//                         $lookup: {
//                             from: "subscribedurations",
//                             localField: "subcribeDuration",
//                             foreignField: "_id",
//                             as: "subscribedurations",
//                         },
//                     },
//                 ])
//                 .sort({ createdAt: -1 });
//             for (let pack of data) {
//                 let newArray = [];
//                 if (pack.S_package_size.toUpperCase() == "S") {
//                     newArray.push({
//                         size: pack.S_package_size,
//                         unit: pack.S_quantity,
//                         delivery: pack.S_delivery,
//                         quota: pack?.services?.s.map(async (v) => {
//                             let serviceData = await servicesSchema.findOne({ _id: v.serviceId })
//                             v.serviceName = serviceData?.serviceName_EN;
//                         }),
//                         pack_description_EN: pack.small_pack_description_EN,
//                         pack_description_TH: pack.small_pack_description_TH,
//                     });
//                 }

//                 if (pack.M_package_size.toUpperCase() == "M") {
//                     newArray.push({
//                         size: pack.M_package_size,
//                         unit: pack.M_quantity,
//                         delivery: pack.M_delivery,
//                         quota: pack?.services?.m.map(async (v) => {
//                             let serviceData = await servicesSchema.findOne({ _id: v.serviceId })
//                             v.serviceName = serviceData?.serviceName_EN;
//                         }),
//                         pack_description_EN: pack.medium_pack_description_EN,
//                         pack_description_TH: pack.medium_pack_description_TH,
//                     });
//                 }
//                 if (pack.L_package_size.toUpperCase() == "L") {
//                     newArray.push({
//                         size: pack.L_package_size,
//                         unit: pack.L_quantity,
//                         delivery: pack.L_delivery,
//                         quota: pack?.services?.l.map(async (v) => {
//                             let serviceData = await servicesSchema.findOne({ _id: v.serviceId })
//                             v.serviceName = serviceData?.serviceName_EN;
//                         }),
//                         pack_description_EN: pack.large_pack_description_EN,
//                         pack_description_TH: pack.large_pack_description_TH,
//                     });
//                 }
//                 for (let service of pack.service) {
//                     service.package = newArray;
//                 }
//                 let obj = {}
//                 const [s, m, l] = await Promise.all([
//                     Promise.all(
//                         pack.services.s.map(async (v) => {
//                             let serviceData = await servicesSchema.findOne({ _id: v.serviceId }).populate('unit');
//                             v.serviceName = serviceData?.serviceName_EN;
//                             v.unit = serviceData?.unit?.title_EN;
//                             return v;
//                         })
//                     ),
//                     Promise.all(
//                         pack.services.m.map(async (v) => {
//                             let serviceData = await servicesSchema.findOne({ _id: v.serviceId }).populate('unit');
//                             v.serviceName = serviceData?.serviceName_EN;
//                             v.unit = serviceData?.unit?.title_EN;
//                             return v;
//                         })
//                     ),
//                     Promise.all(
//                         pack.services.l.map(async (v) => {
//                             let serviceData = await servicesSchema.findOne({ _id: v.serviceId }).populate('unit');
//                             v.serviceName = serviceData?.serviceName_EN;
//                             v.unit = serviceData?.unit?.title_EN;
//                             return v;
//                         })
//                     )
//                 ]);
//                 obj.s = s;
//                 obj.m = m;
//                 obj.l = l;
//                 pack.quotaDatails = obj;
//                 delete pack.services
//             }
//             if (data) {
//                 let response = {
//                     status: true,
//                     message: "data is here",
//                     data: data,
//                     imageUrl: process?.env?.ImageUrl,
//                 };
//                 return res?.json(response);
//             } else {
//                 let response = {
//                     status: false,
//                     message: "No user found",
//                     data: {},
//                 };
//                 return res?.json(response);
//             }
//         } else {
//             let services = await servicesSchema.find({ isDelete: false });

//             let response = {
//                 status: true,
//                 message: "data is here",
//                 data: services,
//                 imageUrl: process?.env?.ImageUrl,
//             };
//             return res?.send(response);
//         }
//     } catch (err) {
//         console.log({ err });
//         return res?.send(err);
//     }
// });

router.get("/package-list", async (req, res) => {
    try {
        const { subcribe_type } = req.query;

        // If it's subscription package type
        if (subcribe_type == "1") {
            const data = await subscriptionSchema.aggregate([
                {
                    $match: {
                        subcribe_type,
                        isDelete: false,
                        status: 1,
                    },
                },
                {
                    $lookup: {
                        from: "services",
                        localField: "services",
                        foreignField: "_id",
                        let: { services: "$services" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $in: ["$_id", "$$services"] },
                                            { $eq: ["$status", 1] },
                                            { $eq: ["$isDelete", false] },
                                        ]
                                    }
                                }
                            },
                            {
                                $lookup: {
                                    from: "units",
                                    localField: "unit",
                                    foreignField: "_id",
                                    let: { unit: "$unit" },
                                    pipeline: [
                                        { $match: { $expr: { $eq: ["$_id", "$$unit"] } } }
                                    ],
                                    as: "unit"
                                }
                            },
                            {
                                $lookup: {
                                    from: "items",
                                    localField: "item",
                                    foreignField: "_id",
                                    let: { item: "$item" },
                                    pipeline: [
                                        { $match: { $expr: { $in: ["$_id", "$$item"] } } },
                                        {
                                            $lookup: {
                                                from: "itemcategories",
                                                localField: "itemCategory",
                                                foreignField: "_id",
                                                let: { itemCategory: "$itemCategory" },
                                                pipeline: [
                                                    { $match: { $expr: { $eq: ["$_id", "$$itemCategory"] } } }
                                                ],
                                                as: "itemCategory"
                                            }
                                        },
                                        {
                                            $lookup: {
                                                from: "itemsizes",
                                                localField: "itemSize",
                                                foreignField: "_id",
                                                let: { itemSize: "$itemSize" },
                                                pipeline: [
                                                    { $match: { $expr: { $in: ["$_id", "$$itemSize"] } } }
                                                ],
                                                as: "itemSize"
                                            }
                                        }
                                    ],
                                    as: "item"
                                }
                            }
                        ],
                        as: "service"
                    }
                },
                {
                    $lookup: {
                        from: "subscribedurations",
                        localField: "subcribeDuration",
                        foreignField: "_id",
                        as: "subscribedurations"
                    }
                }
            ]).sort({ createdAt: -1 });

            for (let pack of data) {
                let newArray = [];

                const buildQuota = async (services) => {
                    return await Promise.all(
                        services.map(async (v) => {
                            const serviceData = await servicesSchema.findOne({ _id: v.serviceId }).populate('unit');
                            return {
                                ...v,
                                serviceName: serviceData?.serviceName_EN,
                                unit: serviceData?.unit?.title_EN
                            };
                        })
                    );
                };

                if (pack.S_package_size?.toUpperCase() === "S") {
                    newArray.push({
                        size: pack.S_package_size,
                        unit: pack.S_quantity,
                        delivery: pack.S_delivery,
                        quota: await buildQuota(pack.services.s || []),
                        pack_description_EN: pack.small_pack_description_EN,
                        pack_description_TH: pack.small_pack_description_TH,
                    });
                }

                if (pack.M_package_size?.toUpperCase() === "M") {
                    newArray.push({
                        size: pack.M_package_size,
                        unit: pack.M_quantity,
                        delivery: pack.M_delivery,
                        quota: await buildQuota(pack.services.m || []),
                        pack_description_EN: pack.medium_pack_description_EN,
                        pack_description_TH: pack.medium_pack_description_TH,
                    });
                }

                if (pack.L_package_size?.toUpperCase() === "L") {
                    newArray.push({
                        size: pack.L_package_size,
                        unit: pack.L_quantity,
                        delivery: pack.L_delivery,
                        quota: await buildQuota(pack.services.l || []),
                        pack_description_EN: pack.large_pack_description_EN,
                        pack_description_TH: pack.large_pack_description_TH,
                    });
                }

                // Attach package info to each service
                pack.service.forEach(service => {
                    service.package = newArray;
                });

                // Create quotaDetails
                pack.quotaDatails = {
                    s: await buildQuota(pack.services.s || []),
                    m: await buildQuota(pack.services.m || []),
                    l: await buildQuota(pack.services.l || [])
                };

                delete pack.services;
            }

            return res.json({
                status: true,
                message: "Data is here",
                data: data,
                imageUrl: process.env.ImageUrl
            });

        } else {
            // Fallback for non-subscription type
            const services = await servicesSchema.find({ isDelete: false });
            return res.json({
                status: true,
                message: "Data is here",
                data: services,
                imageUrl: process.env.ImageUrl
            });
        }
    } catch (err) {
        console.error("Error in /package-list:", err);
        return res.status(500).json({
            status: false,
            message: "Server error",
            error: err.message || err
        });
    }
});

router.post("/apply-offer", async function (req, res) {
    const { type, productId, totalAmount, couponCode } = req.body;

    const findCoupon = await offerPromotionSchema.findOne({
        couponCode,
        // from_date: { $lte: Date.now() },
        // to_date: { $gte: Date.now() },
    });

    if (!findCoupon) {
        return res.send({
            status: false,
            message: "No Coupon found or expired.",
        });
    }
    console.log({ findCoupon });

    let found = false;
    if (type === "1" && findCoupon.service_type === "1") {
        for (const _package of findCoupon.package_id) {
            if (productId.toString() === _package.toString()) {
                found = true;
            }
        }
    } else {
        for (const _regular of findCoupon.regular_id) {
            if (productId.toString() === _regular.toString()) {
                found = true;
            }
        }
    }

    if (found) {
        const amount = findCoupon.offerAmount;
        if (findCoupon.offer_type === "flat") {
            return res.send({
                status: true,
                totalAmount: totalAmount - amount,
                offerAmount: amount,
            });
        } else {
            const amountPercent = findCoupon.offerAmount;
            const amount = (totalAmount * amountPercent) / 100;
            return res.send({
                status: true,
                totalAmount: totalAmount - amount,
                offerAmount: amount,
            });
        }
    } else {
        return res.send({
            status: false,
            message: "This coupon not applied for selected service.",
        });
    }
    // const findCoupon = offerPromotionSchema.findOne({ couponCode });
});
router.get("/single-package-detail", async function (req, res) {
    try {
        // console.log("single user ki detail or package ki id", req.query);
        const singlePack = await subscriptionSchema.aggregate([
            {
                $match: {
                    _id: ObjectId(req.query._id)
                }
            },
            {
                $lookup: {
                    from: "services",
                    foreignField: "_id",
                    localField: `services.${req.query.category.toLowerCase()}.serviceId`,
                    as: "service"
                }
            }, {
                $lookup: {
                    from: "units",
                    localField: "service.unit",
                    foreignField: "_id",
                    as: "units"
                }
            },
            {
                $lookup: {
                    from: "items",
                    localField: "service.item",
                    foreignField: "_id",
                    as: "item"
                }
            },
            {
                $lookup: {
                    from: "itemcategories",
                    localField: "item.itemCategory",
                    foreignField: "_id",
                    as: "itemCategory"
                }
            },
            {
                $lookup: {
                    from: "subscribedurations",
                    localField: "subcribeDuration",
                    foreignField: "_id",
                    as: "subcribeDuration",
                },
            }
        ]);
        const offer = await offerSchema?.findOne({ isDelete: false });
        const serviceArr = [];
        for (const element of singlePack) {
            for (const service of element.service) {
                let itemsData = await itemsSchema.aggregate([{
                    $match: { _id: { $in: service.item } }
                }, {
                    $lookup: {
                        from: "itemcategories",
                        localField: "itemCategory",
                        foreignField: "_id",
                        as: "itemCategory"
                    }
                }, {
                    $unwind: "$itemCategory"
                },
                {
                    $group: {
                        _id: { name: "$itemCategory.itemName_EN", id: "$itemCategory._id" },
                        item: { $push: "$$ROOT" }
                    }
                }]);
                let unitData = await unitSchema.findOne({ _id: service.unit });
                let serviceProcess = await serviceProcessSchema.find({ serviceId: service._id });
                let obj = {
                    packageName_EN: element.packageName_EN,
                    packageName_TH: element.packageName_TH,
                    packageImage: element.image,
                    medium_pack_image: element.medium_pack_image,
                    large_pack_image: element.large_pack_image,
                    small_pack_image: element.small_pack_image,
                    serviceName_EN: service.serviceName_EN,
                    serviceName_TH: service.serviceName_TH,
                    item: itemsData,
                    unit: unitData,
                    quota: element.services[req.query.category.toLocaleLowerCase()]?.find(v => v?.serviceId?.toString() == service?._id?.toString())?.quota,
                    freeDelivery: element[req.query.category.toUpperCase() + "_delivery"],
                    serviceProcess: serviceProcess
                }
                serviceArr.push(obj)
            }
        }
        let response = {
            status: true,
            message: "Detail of this package ",
            data: {
                singlePack: serviceArr,
                offer,
            },
        };
        return res.send(response);
    } catch (err) {
        return res.send(err);
    }
});
router.get("/single-regular-pack-detail", async function (req, res) {
    try {
        // console.log("reguler pack data", req?.query)
        // const service = await servicesSchema.findById(req?.query?.id)
        const service = await servicesSchema.aggregate([
            { $match: { _id: ObjectId(req?.query?.id) } },
            {
                $lookup: {
                    from: "items",
                    localField: "item",
                    foreignField: "_id",
                    let: { item: "$item" },
                    pipeline: [
                        { $match: { $expr: { $in: ["$_id", "$$item"] } } },
                        {
                            $lookup: {
                                from: "itemcategories",
                                localField: "itemCategory",
                                foreignField: "_id",
                                let: { itemCategory: "$itemCategory" },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: { $eq: ["$_id", "$$itemCategory"] },
                                        },
                                    },
                                ],
                                as: "itemCategory",
                            },
                        },
                        // {
                        //   $lookup: {
                        //     from: "itemsizes",
                        //     localField: "itemSize",
                        //     foreignField: "_id",
                        //     let: { itemSize: "$itemSize" },
                        //     pipeline: [
                        //       {
                        //         $match: { $expr: { $in: ["$_id", "$$itemSize"] } },
                        //       },
                        //     ],
                        //     as: "itemSize",
                        //   },
                        // },
                    ],
                    as: "item",
                },
            },
        ]);
        let categoryTempArr = [];
        const Category = [];
        // for getting the category
        for (const catData of service) {
            for (const newData of catData.item) {
                for (const addData of newData.itemCategory) {
                    addData.item = [];
                    let exists = false;
                    for (const _category of Category) {
                        if (_category._id.toString() === addData._id.toString()) {
                            exists = true;
                        }
                    }
                    if (!exists) {
                        Category.push(addData);
                    }
                }
            }
        }
        // console.log("Categoriess ................", Category);
        for (const serviceData of service) {
            // var itemCategory = []
            serviceData.itemCategory = [];
            serviceData.itemCategory.push(...Category);
            // categoryTempArr.push(serviceData)
            // console.log("serviceData ##########3", serviceData);
        }
        for (const itemData of service) {
            for (const item of itemData.item) {
                // service item k thew item category ki id
                for (const newItemData of itemData.itemCategory) {
                    if (newItemData._id.toString() === item.itemCategory[0]._id.toString()) {
                        newItemData.item.push(JSON.parse(JSON.stringify(item)));
                    }
                    // get the item of service
                }
            }
        }

        // console.log("categoryTempArr ...........", categoryTempArr)
        // console.log("service data ............", service)
        // if (service) {
        //   let response = {
        //     status: true,
        //     data: service
        //   }
        //   return res.send(response)
        // } else {
        //   let response = {
        //     status: false,
        //   }
        //   return res.send(response)
        // }
        let response = {
            status: true,
            message: "Detail of Service ",
            data: service,
        };
        return res.send(response);
    } catch (err) {
        console.log(err.message);
        return res.send(err);
    }
});
router.get("/offer-list", async function (req, res) {
    try {
        const data = await offerSchema
            ?.find({ isDelete: false })
            .sort({ createdAt: -1 });
        // console.log(data)
        if (data) {
            let response = {
                status: true,
                message: "data is here",
                data: data,
                // imageUrl: process.env.ImageUrl,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "No data found",
                data: {},
            };
            return res?.send(response);
        }
    } catch (err) {
        return res?.send(err);
    }
});
router.get("/package-detail-info", async function (req, res) {
    // console.log("pack details info")
    try {
        const [noteRemark, globalSetting, services] = await Promise.all([
            NoteRemarkSchema?.find({ isDelete: false }),
            globalSettingSchema?.find(
                {},
                {
                    packageImageEN: 1,
                    packageImageTH: 1,
                }
            ),
            servicesSchema.aggregate([
                {
                    $match: { isDelete: false },
                },
                {
                    $lookup: {
                        from: "items",
                        localField: "item",
                        foreignField: "_id",
                        as: "item",
                    },
                    $lookup: {
                        from: "units",
                        localField: "unit",
                        foreignField: "_id",
                        as: "unit",
                    },
                },
            ]),
        ]);
        // const sliders = await HomeSlider.find({status:1}).select('-__v -isDelete')
        // const services = await servicesSchema.find({ status: 1 }).select('-__v -isDelete')
        const response = {
            status: true,
            message: "",
            data: {
                noteRemark: noteRemark,
                services: services,
                globalSetting: globalSetting,
                imageUrl: process.env.ImageUrl,
            },
        };
        return res.send(response);
    } catch (error) {
        const response = { status: false, message: error?.message };
        return res.json(response);
    }
});
router.post("/social-login", async function (req, res) {
    try {
        const lang = req?.get("Accept-Language");
        const messages = lang == 1 ? messages_en : messages_th;
        const { type, social_id, email, name } = req?.body;
        const user = await UserSchema.findOne({
            "socialLogg.socailId": social_id,
            isDelete: false,
        });
        if (user && user.status == 0) {
            let response = {
                status: false,
                message: "Your account has been suspended.",
                data: {},
            };
            return res.send(response);
        }
        // console.log(user, "find one user")
        const updateType = await UserSchema.findOneAndUpdate(
            { "socialLogg.socailId": social_id },
            {
                loginWith: "social",
                FCMToken: req.body.fcmToken,
                otp: null, // this for verification check
                otpStatus: false, // this for verification check
                emailVerify: true,
            }
        );
        if (user) {
            // console.log("if user mil jata h tho direct token genrate krna h");
            //token
            const userCurrentPackage = await BuyPackageSchema?.aggregate([
                { $match: { userId: user?._id, subscriptionActive: true } },
                {
                    $lookup: {
                        from: "subscriptions",
                        foreignField: "_id",
                        localField: "packageId",
                        let: { packageId: "$packageId" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$_id", "$$packageId"] } } },
                            {
                                $lookup: {
                                    from: "offer&promotions",
                                    foreignField: "package_id",
                                    localField: "_id",
                                    as: "offer&promotions",
                                },
                            },
                        ],
                        as: "packageId",
                    },
                },
            ]);
            user.package = userCurrentPackage;
            jwt.sign(
                { _id: user?._id },
                process?.env?.privateKey,
                function (err, token) {
                    if (err) console?.log(err);
                    let response = {
                        status: true,
                        message: messages?.loginSuccessfull,
                        data: user,
                        token: token,
                        imageUrl: process?.env?.ImageUrl,
                    };
                    return res?.json(response);
                }
            );
        } else {
            const result = Math.random().toString(36).substring(2, 7);
            // console.log("else user ni milta h tho crete krna h ")
            const userData = await UserSchema.findOne({ email, isDelete: false });
            let user = {}
            if (userData) {
                user = await UserSchema.findOneAndUpdate({ email }, {
                    loginWith: "social",
                    FCMToken: req.body.fcmToken,
                    "socialLogg.socialName": type,
                    "socialLogg.socailId": social_id,
                    otp: null, // this for verification check
                    otpStatus: false, // this for verification check
                    emailVerify: true,
                }, {
                    returnDocument: 'after'
                })
            } else {
                user = await UserSchema.create({
                    email,
                    username: name,
                    referral_code: result,
                    "socialLogg.socialName": type,
                    "socialLogg.socailId": social_id,
                    emailVerify: true
                });
            }
            const customer = await omise.customers.create({
                email: email,
                description: "create new customer"
            });
            const omiseCustomer = await UserSchema.findOneAndUpdate({ email }, { omiseCustomerId: customer?.id })
            // const customer = await omise.customers.create({
            //   email: req.email,
            //   description: "create new customer"
            // });
            // console.log(user, "crete hone k bd vala user", user?._id)
            const userCurrentPackage = await BuyPackageSchema?.aggregate([
                { $match: { userId: user?._id, subscriptionActive: true } },
                {
                    $lookup: {
                        from: "subscriptions",
                        foreignField: "_id",
                        localField: "packageId",
                        let: { packageId: "$packageId" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$_id", "$$packageId"] } } },
                            {
                                $lookup: {
                                    from: "offer&promotions",
                                    foreignField: "package_id",
                                    localField: "_id",
                                    as: "offer&promotions",
                                },
                            },
                        ],
                        as: "packageId",
                    },
                },
            ]);
            user.package = userCurrentPackage;
            jwt.sign({ _id: user?._id }, process?.env?.privateKey, function (err, token) {
                if (err) console?.log(err);
                let response = {
                    status: true,
                    message: messages?.loginSuccessfull,
                    data: user,
                    token: token,
                    imageUrl: process?.env?.ImageUrl,
                };
                return res.send(response);
            });
        }
    } catch (err) {
        console.log(err);
        return res.send(err);
    }
});
router.get("/faq-list", async function (req, res) {
    try {
        const faq = await FaqSchema?.find({ isDelete: false });
        if (faq) {
            let response = {
                status: true,
                message: "faq list is here",
                data: faq,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try after some time",
            };
            return res?.send(response);
        }
    } catch (err) {
        return res?.send(err);
    }
});
// aggrement api
router.get("/package-aggrement", async function (req, res) {
    try {
        // console.log(req?.query?.slug, "req data")
        const cms = await cmspageSchema?.findOne({
            slug: req?.query?.slug,
            isDelete: false,
        });
        if (cms) {
            let response = {
                status: true,
                message: "cms list is here",
                data: cms,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try after some time",
            };
            return res?.send(response);
        }
    } catch (err) {
        return res?.send(err);
    }
});

router.use(Auth);

router.get("/current-user", async function (req, res) {
    try {
        const user = await UserSchema.findById(req?.data);
        if (user) {
            let response = {
                status: true,
                message: "Current User Information",
                data: user,
            };
            return res.send(response);
        } else {
            let response = {
                status: false,
                message: "No Information",
            };
            return res.send(response);
        }
    } catch (err) {
        return res.send(err);
    }
});
router.get("/reward-point", async function (req, res) {
    try {
        const loggUser = await UserSchema.findById(req.data);
        // console.log("logg user reward point", loggUser)
        if (loggUser) {
            let response = {
                status: true,
                message: "logg user data",
                data: loggUser,
            };
            return res.send(response);
        } else {
            let response = {
                status: false,
                message: "something went go wrong.",
            };
            return res.send(response);
        }
    } catch (err) {
        return res.send(err);
    }
});
router.get("/transaction-history-reward-point", async function (req, res) {
    try {
        const loggUser = await UserSchema.findById(req.data);
        const referUsers = await UserSchema.find({ referral_id: req.data });
        if (referUsers) {
            let response = {
                status: true,
                message: "logg user data",
                data: referUsers,
            };
            return res.send(response);
        } else {
            let response = {
                status: false,
                message: "something went go wrong.",
            };
            return res.send(response);
        }
    } catch (err) {
        return res.send(err);
    }
});
router.get("/get-profile", async (req, res) => {
    try {
        const user = await UserSchema?.findById(req?.data).lean();
        if (user) {
            let response = {
                status: true,
                message: "Here is profile",
                data: user,
                imageUrl: process?.env?.ImageUrl,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "No user found",
                data: {},
            };
            return res?.send(response);
        }
    } catch (err) {
        const response = { status: false, message: messages?.errorMessage };
        return res?.send(response);
    }
});
router.post("/change-password", [body("currentPassword").exists().withMessage({
    message: "Please enter current password",
}), body("newPassword").exists().withMessage({
    message: "Please enter new password",
}),], async (req, res) => {
    // For Error
    const errors = validationResult(req);
    if (!errors?.isEmpty()) {
        return res?.status(200)?.json({
            status: false,
            message: errors?.errors[0]?.msg?.message,
            data: {},
        });
    }
    UserSchema?.findById(req?.data, "+password", async function (err, data) {
        // console.log("change passwrd", req.body.currentPassword, req.data, data);
        if (err) throw err;
        if (data) {
            if (bcrypt?.compareSync(req?.body?.currentPassword, data?.password)) {
                let user = await UserSchema.findByIdAndUpdate(
                    req?.data,
                    { password: bcrypt?.hashSync(req?.body?.newPassword, salt), },
                    { new: true }
                );
                if (user) {
                    // console.log(user)
                    let response = {
                        status: true,
                        message: "Password updated successfully",
                        data: user,
                    };
                    return res?.send(response);
                }
            } else {
                let response = {
                    status: false,
                    message: "Old password is not correct",
                    data: {},
                };
                return res?.send(response);
            }
        } else {
            let response = {
                status: false,
                message: "User not found",
                data: {},
            };
            return res?.send(response);
        }
    });
}
);
router.post("/update-profile", upload.single("image"), async (req, res) => {
    let userData = await UserSchema.findById(req?.data);
    try {
        let mobile = !_.isEmpty(userData.socialLogg) ? req.body.mobile : userData.mobile;
        let data = {
            username: req?.body?.username,
            // mobile: mobile,
        };
        if (userData.mobile != req.body.mobile) {
            let checkMobile = await UserSchema.findOne({ mobile: req.body.mobile, isDelete: false });
            if (checkMobile) {
                return res.json({
                    message: "Mobile number already exists",
                    status: false
                })
            }
            data.otp = 123456; //Math.floor(100000 + Math.random() * 900000);
            commonHelper.sendOTP({
                mobile: req?.body?.mobile,//req?.body?.mobile.startsWith('0') ? req?.body?.mobile.slice(1) : req?.body?.mobile,
                message: "Your account verification otp " + data.otp
            })
            await UserSchema.findByIdAndUpdate(req?.data, data, {
                new: true,
            });
        }
        if (req.file && req.file.filename) data.image = req?.file?.filename;
        let user = await UserSchema.findByIdAndUpdate(req?.data, data, {
            new: true,
        });
        if (user) {
            // let obj = {
            //   from_Id: req.data,
            //   to_Id: "",
            //   title: "profile update",
            //   body: "your Profile updated successfully",
            //   seen: "0",
            //   type: "profileUpdate",
            // };
            // let notification = commonHelper.sendNotification(obj);
            let response = {
                status: true,
                message: "Profile updated successfully",
                data: user,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "User not found",
                data: {},
            };
            return res?.send(response);
        }
    } catch (err) {
        return res?.send(err);
    }
});
router.get("/aboutus-data", async function (req, res) {
    try {
        const data = await AboutUsSchema?.findOne();
        if (data) {
            let response = {
                status: true,
                message: "data is here",
                data: data,
                imageUrl: process?.env?.ImageUrl,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "No user found",
                data: {},
            };
            return res?.send(response);
        }
    } catch (err) {
        return res?.send(err);
    }
});
router.get("/state-list", async function (req, res) {
    try {
        const state = await StateSchema?.find({ isDelete: false });
        if (state) {
            let response = {
                status: true,
                message: "state list is here",
                data: state,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try after some time",
            };
            return res?.send(response);
        }
    } catch (err) {
        return res?.send(err);
    }
});
router.get("/city-list", async function (req, res) {
    try {
        // console.log(req.query.state_id)
        const city = await CitySchema?.find({
            isDelete: false,
            state_id: req?.query?.state_id,
        });
        // console.log(city)
        if (city) {
            let response = {
                status: true,
                message: "city list is here",
                data: city,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try after some time",
            };
            return res?.send(response);
        }
    } catch (err) {
        return res?.send(err);
    }
});
router.get("/area-list", async function (req, res) {
    try {
        const cityData = await CitySchema?.findOne({ isDelete: false });
        const area = await AreaSchema?.find({
            isDelete: false,
            city_id: ObjectId(cityData?.id),
        });
        // console.log(area)
        if (area) {
            let response = {
                status: true,
                message: "area list is here",
                data: area,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try after some time",
            };
            return res?.send(response);
        }
    } catch (err) {
        return res?.send(err);
    }
});
router.get("/address-list", async function (req, res) {
    // console.log(req.data)
    try {
        const address = await AddressSchema?.find({
            isDelete: false,
            user_id: req?.data,
        });
        if (address) {
            let response = {
                status: true,
                message: "address list is here",
                data: address,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try after some time",
            };
            return res?.send(response);
        }
    } catch (err) {
        return res?.send(err);
    }
});
router.post("/add-address", async function (req, res) {
    try {
        if (req?.body?.default == "1") {
            const temp = {
                default: "0",
            };
            const data = await AddressSchema.updateMany({ user_id: req?.data }, temp);
        } else {
            const data = await AddressSchema.findOne({
                user_id: req?.data,
                isDelete: false,
            });
            if (!data) {
                req.body.default = "1";
            }
        }
        // const user = await AddressSchema.findOne({_id:req.query._id})
        const city = await CitySchema?.findOne({ isDelete: false });
        // console.log(city._id, "city id ")
        const Data = new AddressSchema({
            user_id: ObjectId(req?.data),
            location: {
                type: "Point",
                coordinates: [req?.body?.lng, req?.body?.lat],
            },
            address: req?.body?.address,
            addressDetails: req?.body?.addressDetails,
            mobile: req?.body?.mobile,
            type: req?.body?.type,
            // state_id: req.body.state_id,
            city_id: ObjectId(city?._id),
            default: req?.body?.default,
            area_id: ObjectId(req?.body?.area_id),
            noteToDriver: req.body.noteToDriver
        });
        // console.log("add address mobile api", Data, "logged in user")

        Data?.save(async function (err, data) {
            // console.log(err)
            if (err) {
                let response = { status: false, message: err?.message, data: {} };
                return res?.send(response);
            }
            if (data) {
                let response = {
                    status: true,
                    message: "Address successfully created",
                    data: data,
                };
                return res?.send(response);
            } else {
                let response = {
                    status: false,
                    message: "Oops something wrong please try latter",
                };
                return res?.send(response);
            }
        });
    } catch (err) {
        return res?.send(err);
    }
});
// noteToDriver
router.post("/edit-address", async function (req, res) {
    try {
        const city = await CitySchema?.findOne({ isDelete: false });
        const defalutAddress = {
            default: "0",
        };
        const temp = {
            user_id: ObjectId(req?.data),
            location: {
                type: "Point",
                coordinates: [req?.body?.lng, req?.body?.lat],
            },
            address: req?.body?.address,
            addressDetails: req?.body?.addressDetails,
            type: req?.body?.type,
            noteToDriver: req?.body?.noteToDriver,
            // state_id: req.body.state_id,
            // city_id: req.body.city_id,
            city_id: ObjectId(city?._id),
            default: req?.body?.default,
            area_id: req?.body?.area_id,
            mobile: req?.body?.mobile,
        };
        const user = await AddressSchema?.findOne({
            _id: req?.query?.id,
            isDelete: false,
        });
        const data = await AddressSchema?.updateMany(
            { user_id: user?.user_id },
            defalutAddress
        );
        AddressSchema.findOneAndUpdate(
            { _id: req?.query?.id, isDelete: false },
            temp,
            function (err, doc) {
                // console.log(doc, "doc data")
                if (err) throw err;
                if (doc) {
                    let response = {
                        status: true,
                        message: "Updated successfully",
                        data: doc,
                    };
                    return res?.send(response);
                } else {
                    let response = {
                        status: false,
                        message: "Something wrong",
                        data: doc,
                    };
                    return res?.send(response);
                }
            }
        );
    } catch (err) {
        let response = {
            status: false,
            message: "Something wrong",
            data: err,
        };
        return res?.send(response);
    }
});
router.delete("/delete-address", async function (req, res) {
    try {
        AddressSchema.findOneAndUpdate(
            { _id: req?.query?.id, isDelete: false },
            { isDelete: true },
            function (err, doc) {
                if (err) throw err;
                let response = {
                    status: true,
                    message: "Deleted successfully",
                    data: {},
                };
                return res?.send(response);
            }
        );
    } catch (err) {
        return res?.send(err);
    }
});
router.get("/default-address", async (req, res) => {
    try {
        const temp = {
            default: "0",
        };
        const user = await AddressSchema.findOne({
            _id: req?.query?._id,
            isDelete: false,
        });
        const data = await AddressSchema.updateMany(
            { user_id: user?.user_id },
            temp
        );
        const address = await AddressSchema?.findByIdAndUpdate(
            { _id: req?.query?._id, isDelete: false },
            { default: "1" }
        );
        if (address) {
            let response = {
                status: true,
                message: "Address is here",
                data: address,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "No service found",
                data: {},
            };
            return res?.send(response);
        }
    } catch (err) {
        return res?.send(err);
    }
});
router.get("/addOnService-list", async function (req, res) {
    try {
        const data = await AddOnServiceSchema?.aggregate([{
            $match: {
                isDelete: false
            }
        }, {
            $lookup: {
                from: "offer&promotions",
                localField: "offer",
                foreignField: "_id",
                as: "offers"
            }
        }, {
            $unwind: {
                path: "$offers",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                //     "_id": 1,
                "serviceName_EN": 1,
                "serviceName_TH": 1,
                "description_EN": 1,
                "description_TH": 1,
                "addOnServiceQuantity": 1,
                "image": 1,
                "status": 1,
                "isDelete": 1,
                "to_date": 1,
                "from_date": 1,
                "price": 1,
                "offer": 1,
                "offerStatus": 1,
                "createdAt": 1,
                "updatedAt": 1,
                "offers": {
                    "_id": 1,
                    "service_type": 1,
                    "regular_id": 1,
                    "title_EN": 1,
                    "title_TH": 1,
                    "offer_type": 1,
                    "offerQuantity": 1,
                    "offerAmount": 1,
                    "minimumCartValue": 1,
                    "couponCode": 1,
                    "to_date": 1,
                    "from_date": 1,
                    "description_EN": 1,
                    "description_TH": 1,
                    "image_EN": 1,
                    "image_TH": 1,
                    "status": 1,
                    "isDelete": 1,
                    "createdAt": 1,
                    "updatedAt": 1,
                },
                finalPrice: {
                    $switch: {
                        branches: [
                            {
                                case: { $eq: ["$offers.offer_type", "percent"] }, then: {
                                    $multiply: ["$price", { $subtract: [1, { $divide: ["$offers.offerAmount", 100] }] }]
                                }
                            },
                            {
                                case: { $eq: ["$offers.offer_type", "flat"] }, then: {
                                    $subtract: ["$price", "$offers.offerAmount"],
                                }
                            },
                        ],
                        default: "$offers.offer_type"
                    }
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }]);
        console.log({ data })
        // console.log(data.length)
        if (data) {
            let response = {
                status: true,
                message: "data list is here",
                data: data,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try after some time",
            };
            return res?.send(response);
        }
    } catch (err) {
        return res?.send(err);
    }
});
router.post("/set-notification", async function (req, res) {
    try {
        // console.log("req type",req.data)
        const notificationSetting = {
            emailNotification: req?.body?.emailNotification,
            pushNotification: req?.body?.pushNotification,
        };
        const data = await UserSchema?.findByIdAndUpdate(
            { _id: req?.data },
            notificationSetting,
            { new: true }
        );
        // console.log(data)
        let response = {
            status: true,
            message: "Notification setting successfully",
            data: data,
        };
        return res?.send(response);
    } catch (err) {
        return res?.send(err);
    }
});
router.get("/notification-list", async function (req, res) {
    try {
        let notification = await NotificationSchema.aggregate([
            {
                $match: {
                    $or: [
                        {
                            from_Id: { $eq: ObjectId(req.data) },
                        },
                        {
                            to_Id: { $eq: ObjectId(req.data) },
                        },
                    ],
                },
            },
            {
                $project: {
                    _id: 1,
                    from_id: 1,
                    to_id: 1,
                    title: 1,
                    body: 1,
                    seen: 1,
                    type: 1,
                    status: 1,
                    createdAt: 1,
                    date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                },
            },
            {
                $group: {
                    _id: { date: "$date" },
                    notifications: {
                        $push: {
                            _id: "$_id",
                            from_id: "$from_id",
                            to_id: "$to_id",
                            title: "$title",
                            body: "$body",
                            seen: "$seen",
                            type: "$type",
                            status: "$status",
                            createdAt: "$createdAt",
                        },
                    },
                },
            },
        ]);
        return res.json({
            data: notification,
            status: true,
            message: "Notification list",
        });
    } catch (err) {
        return res.json({
            data: [],
            status: false,
            message: err.message,
        });
        return res.send(err);
    }
});
router.get("/order-note", async function (req, res) {
    try {
        const data = await orderNoteSchema?.findOne({ isDelete: false });
        if (data) {
            let response = {
                status: true,
                message: "data is here",
                data: data,
                imageUrl: process?.env?.ImageUrl,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "No user found",
                data: {},
            };
            return res?.send(response);
        }
    } catch (err) {
        return res?.send(err);
    }
});
// router.post("/insert-order-placed",upload.array("packets[image]"), async function (req, res) {
//     try {
//         console.log("req.body",req.body)
//         const now = new Date();
//         const currentHour = now.getHours();
//         const orderedUser = await placedOrderSchema.find({ userId: req?.data });
//         let packetsJson = req.body.packets;
//         if (typeof packetsJson === "string") {
//         try {
//           packetsJson = JSON.parse(packetsJson);
//            } catch (e) {
//            packetsJson = [];
//           }
//        }

// let packets = Array.isArray(packetsJson) ? packetsJson : [];
// console.log("packetsJson", packetsJson);
// console.log("packets", req);

//       // Now map uploaded images to packets
//       let uploadedFiles = req.files ||[];
//       packets = packets.map((packet, index) => ({
//         image: uploadedFiles[index]?.path || null,
//         note: packet.note || "",
//       }));
//       console.log(uploadedFiles,'uploadedFiles')
// console.log(packets, 'packetsnew')
//       // fallback if no packets sent
//       if (packets.length === 0) {
//         packets = [{ image: null, note: null }];
//       }
//         const user = await UserSchema.findById(req?.data);
//         const refUser = await UserSchema.findById(user?.referral_id);
//         const data = await placedOrderSchema?.find({
//             userId: req?.data,
//             $and: [
//                 { orderStatus: { $ne: "deliverd" } },
//                 { orderStatus: { $nin: ["cancel(customer)", "cancel(driver)", "cancel(admin)"] } },
//             ],
//         });
//         console.log({ data });

//         if (data?.length > 0) {
//             //check krna h is user k sabhi oredr ka status vo deliver h tho new order add krna h
//             let response = {
//                 status: false,
//                 message: "you can't order new order befor delivered your previous order",
//             };
//             return res?.send(response);
//         } else {
//             const addonServiceDetails = await AddOnServiceSchema?.find({
//                 _id: JSON.parse(req?.body?.addOnServiceId),
//             });
//             const addressData = await AddressSchema?.find({
//                 isDelete: false,
//                 _id: ObjectId(req?.body?.addressId),
//             });
//             const priviousOrderId = await placedOrderSchema
//                 ?.findOne({}, { orderId: 1 })
//                 .sort({ _id: -1 })
//                 .limit(1);
//             const offlineOrder = await offlineOrderSchema
//                 .findOne({})
//                 .sort("-createdAt")
//                 .limit(1);
//             let onlineOrder = await placedOrderSchema
//                 .findOne({})
//                 .sort("-orderId")
//                 .limit(1);
//             let orderId = await offlineOrderSchema
//                 .findOne({})
//                 .sort("-orderId")
//                 .limit(1);
//             let orderID = 0;
//             if (onlineOrder && onlineOrder.orderId) {
//                 if (orderId && orderId.orderId) {
//                     if (Number(onlineOrder.orderId) > Number(orderId.orderId)) {
//                         orderID = onlineOrder.orderId * 1 + 1;
//                     } else {
//                         orderID = orderId.orderId * 1 + 1;
//                     }
//                 } else {
//                     orderID = onlineOrder.orderId * 1 + 1;
//                 }
//             } else {
//                 if (orderId && orderId.orderId) {
//                     orderID = orderId.orderId * 1 + 1;
//                 } else {
//                     orderID = 1000;
//                 }
//             }
//             var array = Object?.values(JSON.parse(req?.body?.addOnServiceId));
//             let newArray = array?.map((v) => ObjectId(v));
//             const addressArea = await AddressSchema?.findOne({
//                 user_id: req?.data,
//                 default: "1",
//                 isDelete: false,
//             });
//             if (_.isNull(addressArea)) {
//                 let response = {
//                     status: false,
//                     message: "Choose an other address",
//                 };
//                 return res?.send(response);
//             }
//             const driverAreaAssign = await UserSchema?.findOne({
//                 areaName: addressArea?.area_id,
//                 isDelete: false,
//                 role: "driver",
//             });

//             if (_.isNull(driverAreaAssign)) {
//                 let response = {
//                     status: false,
//                     message: "Choose an other address beacause driver not available in this address",
//                 };
//                 return res?.send(response);
//             }
//             const addOnServiceDetailsWithQuantity = addonServiceDetails.map((service, index) => ({
//                 ...service._doc,
//                 quantity: req?.body?.addOnServiceItemQuantity[index],
//             }));
//             // Get the current date and time
//             const currentDate = new Date();
//             const deliveryDate = new Date(currentDate.getTime() + (48 * 60 * 60 * 1000));
//             const Data = new placedOrderSchema({
//                 addressId: ObjectId(req?.body?.addressId),
//                 addressDetail: JSON?.stringify(addressData),
//                 userId: ObjectId(req?.data),
//                 addOnServiceDetail: JSON?.stringify(addOnServiceDetailsWithQuantity),
//                 addOnServiceId: newArray,
//                 applyOffer: req?.body?.applyOffer,
//                 offerData: req?.body?.offerData,
//                 noOfPacket: req?.body?.noOfPacket,
//                 noteToDriver: req?.body?.noteToDriver,
//                 noteToGarmentExpert: req?.body?.noteToGarmentExpert,
//                 pickupToDeliverTime: req?.body?.pickupToDeliverTime,
//                 orderId: orderID,
//                 // orderQR: QR,
//                 // services: newServiceArray,
//                 pickup_driver: driverAreaAssign?._id,
//                 orderType: "online",
//                 deliveryDate: deliveryDate,
//                 pickUpDate: new Date(),
//                 packets
//                 // orderStatus: "1"
//             });
//             Data.save(async function (err, data) {
//                 if (err) {
//                     let response = { status: false, message: err?.message, data: {} };
//                     return res?.send(response);
//                 }
//                 if (data) {
//                     const nextPickupTime = await globalSettingSchema.find();
//                     const currentTime = moment().format("MMMM DD YYYY hh:mm:ss a");
//                     const globalPickupTime = moment(
//                         nextPickupTime[0]?.nextPickupTime
//                     ).format("MMMM DD YYYY hh:mm:ss a");
//                     const createdAtTime = moment(data?.createdAt).format(
//                         "MMMM DD YYYY hh:mm:ss a"
//                     );
//                     let updateTimeData;
//                     if (createdAtTime > globalPickupTime) {
//                         const temp = {
//                             createdAt: moment(data?.createdAt).add(1, "days"),
//                         };
//                         updateTimeData = await placedOrderSchema?.findByIdAndUpdate(
//                             { _id: data?._id },
//                             temp,
//                             { new: true }
//                         );
//                     }
//                     if (orderedUser.length == 0 && user?.referral_id != null) {
//                         const updateRewardPoint = {
//                             earning_point:
//                                 Number(refUser?.earning_point) + Number(refUser?.reward_point),
//                         };
//                         const temp = {
//                             earning_point: user?.reward_point,
//                         };
//                         await UserSchema.findByIdAndUpdate(user?._id, temp, { new: true });
//                         await UserSchema?.findByIdAndUpdate(
//                             user?.referral_id,
//                             updateRewardPoint,
//                             { new: true }
//                         );
//                     }

//                     let response = {
//                         status: true,
//                         message: "Order Placed successfully",
//                         data: updateTimeData,
//                         // driverData: driverAreaAssign
//                     };
//                     const FCMToken = driverAreaAssign?.FCMToken;


//                     console.log({ FCMToken });

//                     // console.log(driverAreaAssign, FCMToken, data.orderId)
//                     let messageObj = {
//                         title: "Cue Laundary Van",
//                         body: `Order Id:- #${data.orderId} You have a new order .`,
//                         types: `${data.orderId}`,
//                     };
//                     // console.log(messageObj)
//                     let customer = await UserSchema.findOne({
//                         _id: req.data,
//                         pushNotification: "1",
//                     });
//                     if (FCMToken) {
//                         const notification = commonHelper?.pushNotificationSend(
//                             FCMToken,
//                             messageObj
//                         );
//                     }
//                     if (customer?.FCMToken) {
//                         commonHelper?.pushNotificationSendCustomer(
//                             customer?.FCMToken,
//                             messageObj
//                         );
//                     }
//                     let template = await TemplateSchema?.findOne({ slug: 'new-order-placed' });
//                     template.description = template?.description?.replace("{orderId}", data?.orderId);
//                     template.description = template?.description?.replace("{user}", customer?.name);
//                     let admin = await UserSchema.findOne({ role: 'admin' });
//                     let mailData = {
//                         email: admin.email,
//                         subject: template?.title || "",
//                         html: template?.description || "",
//                     };
//                     mailSend(mailData);
//                     return res?.send(response);
//                 } else {
//                     let response = {
//                         status: false,
//                         message: "Oops something wrong please try latter",
//                     };
//                     return res?.send(response);
//                 }

//             });
//         }
//     } catch (err) {
//         console.log(err,'err is ')
//         return res?.send(err?.message);
//     }
// });

router.post("/insert-order-placed", upload.array("packets[image]"), async function (req, res) {
    try {
        // -------------------------------
        // Parse packets
        // -------------------------------
        console.log("first")
        let packetsJson = typeof req.body.packets === "string" ? JSON.parse(req.body.packets || "[]") : req.body.packets || [];
        let uploadedFiles = req.files || [];
        let packets = Array.isArray(packetsJson) ? packetsJson.map((packet, index) => ({
            image: uploadedFiles[index]?.path || null,
            note: packet.note || "",
        })) : [{ image: null, note: null }];

        // -------------------------------
        // Fetch user and previous orders in parallel
        // -------------------------------
        const [user, orderedUser] = await Promise.all([
            UserSchema.findById(req.data),
            placedOrderSchema.find({
                userId: req.data,
                $and: [
                    { orderStatus: { $ne: "deliverd" } },
                    { orderStatus: { $nin: ["cancel(customer)", "cancel(driver)", "cancel(admin)"] } },
                ],
            })
        ]);

        if (!user) return res.send({ status: false, message: "User not found" });

        // Prevent new order if previous order is not delivered
        if (orderedUser?.length > 0) {
            return res.send({
                status: false,
                message: "You can't order new order before delivering your previous order",
            });
        }

        const refUser = user.referral_id ? await UserSchema.findById(user.referral_id) : null;

        // -------------------------------
        // Fetch add-on services, address, and driver info
        // -------------------------------
        let addOnServiceIds = [];
        try {
            addOnServiceIds = req.body.addOnServiceId ? JSON.parse(req.body.addOnServiceId) : [];
        } catch (e) {
            console.error("Error parsing addOnServiceId:", e);
            addOnServiceIds = [];
        }

        const [addonServiceDetails, addressData, addressArea] = await Promise.all([
            AddOnServiceSchema.find({ _id: { $in: Array.isArray(addOnServiceIds) ? addOnServiceIds.map(id => ObjectId(id)) : [] } }),
            AddressSchema.find({ isDelete: false, _id: req.body.addressId ? ObjectId(req.body.addressId) : null }),
            AddressSchema.findOne({ user_id: req.data, default: "1", isDelete: false })
        ]);

        if (!addressArea) return res.send({ status: false, message: "Choose another address" });

        const driverAreaAssign = await UserSchema.findOne({
            areaName: addressArea.area_id,
            isDelete: false,
            role: "driver"
        });

        if (!driverAreaAssign) return res.send({
            status: false,
            message: "Choose another address because driver not available in this area"
        });

        // -------------------------------
        // Calculate orderID atomically
        // -------------------------------
        const [onlineOrder, offlineOrder] = await Promise.all([
            placedOrderSchema.findOne({}).sort({ orderId: -1 }).select("orderId").lean(),
            offlineOrderSchema.findOne({}).sort({ orderId: -1 }).select("orderId").lean(),
        ]);

        let orderID = 1000;
        if (onlineOrder?.orderId && offlineOrder?.orderId) {
            orderID = Math.max(Number(onlineOrder.orderId), Number(offlineOrder.orderId)) + 1;
        } else if (onlineOrder?.orderId) {
            orderID = Number(onlineOrder.orderId) + 1;
        } else if (offlineOrder?.orderId) {
            orderID = Number(offlineOrder.orderId) + 1;
        }

        // -------------------------------
        // Prepare add-on services with quantity
        // -------------------------------
        const addOnServiceDetailsWithQuantity = addonServiceDetails.map((service, index) => ({
            ...service._doc,
            quantity: req.body.addOnServiceItemQuantity[index],
        }));

        // -------------------------------
        // Create new order
        // -------------------------------
        const deliveryDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
        const newOrder = new placedOrderSchema({
            addressId: ObjectId(req.body.addressId),
            addressDetail: JSON.stringify(addressData),
            userId: ObjectId(req.data),
            addOnServiceDetail: JSON.stringify(addOnServiceDetailsWithQuantity),
            addOnServiceId: addonServiceDetails.map(a => a._id),
            applyOffer: req.body.applyOffer,
            offerData: req.body.offerData,
            noOfPacket: req.body.noOfPacket,
            noteToDriver: req.body.noteToDriver,
            noteToGarmentExpert: req.body.noteToGarmentExpert,
            pickupToDeliverTime: req.body.pickupToDeliverTime,
            orderId: orderID,
            pickup_driver: driverAreaAssign._id,
            orderType: "online",
            deliveryDate,
            pickUpDate: new Date(),
            packets
        });

        const savedOrder = await newOrder.save();

        // -------------------------------
        // Update global pickup time if needed
        // -------------------------------
        const nextPickupTime = await globalSettingSchema.find();
        const currentTime = moment(savedOrder.createdAt);
        const globalPickupTime = moment(nextPickupTime[0]?.nextPickupTime);

        if (currentTime.isAfter(globalPickupTime)) {
            await placedOrderSchema.findByIdAndUpdate(savedOrder._id, {
                createdAt: currentTime.add(1, "days").toDate()
            }, { new: true });
        }

        // -------------------------------
        // Handle referral reward points
        // -------------------------------
        if (orderedUser.length === 0 && user?.referral_id != null && refUser) {
            await Promise.all([
                UserSchema.findByIdAndUpdate(user._id, { earning_point: user.reward_point }, { new: true }),
                UserSchema.findByIdAndUpdate(user.referral_id, {
                    earning_point: Number(refUser.earning_point) + Number(refUser.reward_point)
                }, { new: true })
            ]);
        }

        // -------------------------------
        // Async notifications & emails
        // -------------------------------
        setImmediate(async () => {
            const messageObj = {
                title: "Cue Laundry Van",
                body: `Order Id: #${savedOrder.orderId} You have a new order.`,
                types: `${savedOrder.orderId}`,
            };

            if (driverAreaAssign?.FCMToken) {
                commonHelper.pushNotificationSend(driverAreaAssign.FCMToken, messageObj);
            }

            const customer = await UserSchema.findOne({ _id: req.data, pushNotification: "1" });
            if (customer?.FCMToken) {
                commonHelper.pushNotificationSendCustomer(customer.FCMToken, messageObj);
            }

            const template = await TemplateSchema.findOne({ slug: 'new-order-placed' });
            if (template) {
                let description = template.description
                    .replace("{orderId}", savedOrder.orderId)
                    .replace("{user}", customer?.name || "");
                const admin = await UserSchema.findOne({ role: 'admin' });
                if (admin?.email) {
                    mailSend({ email: admin.email, subject: template.title || "", html: description });
                }
            }
        });

        // -------------------------------
        // Send success response
        // -------------------------------
        return res.send({
            status: true,
            message: "Order placed successfully",
            data: savedOrder
        });

    } catch (err) {
        console.error("Insert order error:", err);
        return res.status(500).send({ status: false, message: err.message });
    }
});

router.get("/get-our-service", async function (req, res) {
    try {
        const data = await OurServicesSchema?.find();
        if (data) {
            let response = {
                status: true,
                message: "data is here",
                data: data,
                imageUrl: process?.env?.ImageUrl,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "No user found",
                data: {},
            };
            return res?.send(response);
        }
    } catch (err) {
        return res?.send(err);
    }
});
//Buy Package Api
// router.post("/buy-package", async function (req, res) {
//     try {
//         const offerDetails = await offerPromotionSchema?.find({
//             _id: req?.body?.offerDetails != "" ? ObjectId(req?.body?.offerDetails) : null,
//         });
//         console.log("aaya");
//         const temp = {
//             userId: req?.data,
//             packageId: req?.body?.packageId,
//             packageCategory: req?.body?.packageCategory,
//             offerDetails: offerDetails ? JSON?.stringify(offerDetails) : null,
//             buyDate: req?.body?.buyDate,
//             subscriptionActive: true
//         };
//         const packdata = await subscriptionSchema.aggregate([
//             { $match: { _id: ObjectId(req?.body?.packageId) } },
//             {
//                 $lookup: {
//                     from: "subscribedurations",
//                     localField: "subcribeDuration",
//                     foreignField: "_id",
//                     as: "subcribeDuration",
//                 },
//             },
//         ]);
//         // const packdata = await subscriptionSchema.findById({ _id: req?.body?.packageId })
//         for (const data of packdata) {
//             for (const duration of data.subcribeDuration) {
//                 data.duration = duration.duration;
//             }
//         }
//         const packHistoryTempData = {
//             packageId: req?.body?.packageId,
//             userId: req?.data,
//             buyDate: req?.body?.buyDate,
//             PackageDuration: packdata[0].duration,
//             packageCategory: req?.body?.packageCategory,
//             packagePrice: req?.body?.packageCategory == "S" ? packdata[0].S_price : req?.body?.packageCategory == "M" ? packdata[0].M_price : packdata[0].L_price,
//         };
//         //find logg user status update in history or save data
//         const updatePackageHistory = await PackageHistorySchema.updateMany({ userId: req?.data }, { status: 0 });
//         const packHistoryData = new PackageHistorySchema(packHistoryTempData);
//         await packHistoryData?.save();
//         const packageUser = await BuyPackageSchema.findOne({ userId: req?.data, subscriptionActive: true });
//         if (packageUser) {
//             const updatePackage = await BuyPackageSchema.findOneAndUpdate({ userId: req?.data }, temp, { new: true });
//             const getPackageDetails = await subscriptionSchema.findOne({ _id: req?.body?.packageId });
//             if (getPackageDetails) {
//                 let filterData = getPackageDetails.services[req?.body?.packageCategory.toLowerCase()].flatMap((v) => v.serviceId);
//                 const checkRemainingServiceQuota = await RemainingServiceQuotaSchema.findOne({ userId: req.data });
//                 if (checkRemainingServiceQuota) {
//                     const updatePackageData = await RemainingServiceQuotaSchema.findOneAndUpdate({ userId: req.data }, { packageId: req.body.packageId });
//                     const removeNotExist = await RemainingServiceQuotaSchema.findOneAndUpdate({ userId: req.data }, {
//                         $pull: {
//                             remainingServicesQuota: {
//                                 value: {
//                                     $nin: filterData
//                                 }
//                             }
//                         }
//                     });
//                     for (const service of getPackageDetails.services[req?.body?.packageCategory.toLowerCase()]) {
//                         const serviceDetails = await servicesSchema.findOne({ _id: service.serviceId });
//                         const getRemainingQuataDetails = await RemainingServiceQuotaSchema.findOne({ userId: req.data, remainingServicesQuota: { $elemMatch: { "value": service.serviceId } } });
//                         if (getRemainingQuataDetails) {
//                             const updateQuota = await RemainingServiceQuotaSchema.findOneAndUpdate({ userId: req.data, "remainingServicesQuota.value": service.serviceId }, {
//                                 $inc: { "remainingServicesQuota.$.quota": Number(service.quota || 0) }, $set: {
//                                     deliveryQuota: (req?.body?.packageCategory).toLowerCase() == "s" ? Number(packdata[0]?.S_delivery) : (req?.body?.packageCategory).toLowerCase() == "m" ? Number(packdata[0]?.M_delivery) : (req?.body?.packageCategory).toLowerCase() == "l" ? Number(packdata[0]?.L_delivery) : 0
//                                 }
//                             }, { returnDocument: "after" });
//                         } else {
//                             const updatedQuota = await RemainingServiceQuotaSchema.findOneAndUpdate({ userId: req.data }, {
//                                 $push: {
//                                     "remainingServicesQuota": {
//                                         "quota": Number(service.quota),
//                                         "value": service.serviceId,
//                                         "serviceName": serviceDetails.serviceName_EN
//                                     }
//                                 },
//                                 $set: {
//                                     deliveryQuota: (req?.body?.packageCategory).toLowerCase() == "s" ? Number(packdata[0]?.S_delivery) : (req?.body?.packageCategory).toLowerCase() == "m" ? Number(packdata[0]?.M_delivery) : (req?.body?.packageCategory).toLowerCase() == "l" ? Number(packdata[0]?.L_delivery) : 0
//                                 }
//                             }, { returnDocument: "after" })
//                         }
//                     }
//                 } else {
//                     let finalQuata = [];
//                     for (const package of packdata[0].services[(req?.body?.packageCategory).toLowerCase()]) {
//                         let serviceDetails = await servicesSchema.findOne({ _id: package?.serviceId });
//                         let obj = {
//                             quota: package?.quota || 0,
//                             value: package.serviceId,
//                             serviceName: serviceDetails?.serviceName_EN
//                         }
//                         finalQuata.push(obj)
//                     }
//                     const remainingQuato = await RemainingServiceQuotaSchema.create({
//                         userId: req?.data,
//                         packageId: packdata[0]?._id,
//                         buyPackageId: packageUser?._id,
//                         remainingServicesQuota: finalQuata,
//                         deliveryQuota: (req?.body?.packageCategory).toLowerCase() == "s" ? Number(packdata[0]?.S_delivery) : (req?.body?.packageCategory).toLowerCase() == "m" ? Number(packdata[0]?.M_delivery) : (req?.body?.packageCategory).toLowerCase() == "l" ? Number(packdata[0]?.L_delivery) : 0
//                     });
//                 }
//             }
//             await commonHelper.quotaDeduction(temp)
//             if (updatePackage) {
//                 let response = {
//                     status: true,
//                     message: "Your package update successfully",
//                     data: updatePackage,
//                 };
//                 return res?.send(response);
//             } else {
//                 let response = {
//                     status: false,
//                     message: "Oops somthing went go wrong",
//                 };
//                 return res?.send(response);
//             }
//         } else {
//             const Data = new BuyPackageSchema(temp);
//             Data.save(async (err, data) => {
//                 if (err) {
//                     let response = {
//                         status: false,
//                         message: err?.message,
//                         data: {},
//                     };
//                     return res?.send(response);
//                 }
//                 if (data) {
//                     let finalQuata = [];
//                     for (const package of packdata[0].services[(req?.body?.packageCategory).toLowerCase()]) {
//                         let serviceDetails = await servicesSchema.findOne({ _id: package?.serviceId });
//                         let obj = {
//                             quota: package?.quota,
//                             value: package.serviceId,
//                             serviceName: serviceDetails?.serviceName_EN
//                         }
//                         finalQuata.push(obj)
//                     }

//                     const remainingQuato = await RemainingServiceQuotaSchema.create({
//                         userId: req?.data,
//                         packageId: packdata[0]?._id,
//                         buyPackageId: data?._id,
//                         remainingServicesQuota: finalQuata,
//                         deliveryQuota: (req?.body?.packageCategory).toLowerCase() == "s" ? Number(packdata[0]?.S_delivery) : (req?.body?.packageCategory).toLowerCase() == "m" ? Number(packdata[0]?.M_delivery) : (req?.body?.packageCategory).toLowerCase() == "l" ? Number(packdata[0]?.L_delivery) : 0
//                     });
//                     await commonHelper.quotaDeduction(temp)
//                     let response = {
//                         status: true,
//                         message: "Package Buy Successfully",
//                         data: data,
//                     };
//                     return res.send(response);
//                 } else {
//                     let response = {
//                         status: false,
//                         message: "Opps something went go wrong ",
//                     };
//                     return res.send(response);
//                 }
//             });
//         }
//     } catch (err) {
//         console.log({ err: err.message });
//         return res.send(err);
//     }
// });
router.post("/buy-package", async function (req, res) {
    try {
        let offerDetails = null;
        if (req?.body?.offerDetails && req?.body?.offerDetails !== "") {
            try {
                offerDetails = await offerPromotionSchema?.find({
                    _id: ObjectId(req?.body?.offerDetails),
                });
            } catch (e) {
                console.error("Error fetching offerDetails:", e);
            }
        }

        console.log("buy-package started for user:", req?.data);
        const temp = {
            userId: req?.data,
            packageId: req?.body?.packageId,
            packageCategory: req?.body?.packageCategory,
            offerDetails: offerDetails ? JSON?.stringify(offerDetails) : null,
            buyDate: req?.body?.buyDate,
            subscriptionActive: true
        };
        const packdata = await subscriptionSchema.aggregate([
            { $match: { _id: req?.body?.packageId ? ObjectId(req?.body?.packageId) : null } },
            {
                $lookup: {
                    from: "subscribedurations",
                    localField: "subcribeDuration",
                    foreignField: "_id",
                    as: "subcribeDuration",
                },
            },
        ]);
        console.log("Package data found:", packdata.length);
        // const packdata = await subscriptionSchema.findById({ _id: req?.body?.packageId })
        for (const data of packdata) {
            for (const duration of data.subcribeDuration) {
                data.duration = duration.duration;
            }
        }
        const packHistoryTempData = {
            packageId: req?.body?.packageId,
            userId: req?.data,
            buyDate: req?.body?.buyDate,
            PackageDuration: packdata[0].duration,
            packageCategory: req?.body?.packageCategory,
            packagePrice: req?.body?.packageCategory == "S" ? packdata[0].S_price : req?.body?.packageCategory == "M" ? packdata[0].M_price : packdata[0].L_price,
        };
        //find logg user status update in history or save data
        const updatePackageHistory = await PackageHistorySchema.updateMany({ userId: req?.data }, { status: 0 });
        const packHistoryData = new PackageHistorySchema(packHistoryTempData);
        await packHistoryData?.save();
        const packageUser = await BuyPackageSchema.findOne({ userId: req?.data, subscriptionActive: true });
        if (packageUser) {
            console.log("Existing active package found, updating...");
            const updatePackage = await BuyPackageSchema.findOneAndUpdate({ userId: req?.data }, temp, { new: true });
            const getPackageDetails = await subscriptionSchema.findOne({ _id: req?.body?.packageId });
            if (getPackageDetails) {
                console.log("Package details found for category:", req?.body?.packageCategory);
                let filterData = getPackageDetails.services[req?.body?.packageCategory?.toLowerCase()].flatMap((v) => v.serviceId);
                const checkRemainingServiceQuota = await RemainingServiceQuotaSchema.findOne({ userId: req.data });
                if (checkRemainingServiceQuota) {
                    const updatePackageData = await RemainingServiceQuotaSchema.findOneAndUpdate({ userId: req.data }, { packageId: req.body.packageId });
                    const removeNotExist = await RemainingServiceQuotaSchema.findOneAndUpdate({ userId: req.data }, {
                        $pull: {
                            remainingServicesQuota: {
                                value: {
                                    $nin: filterData
                                }
                            }
                        }

                    });
                    for (const service of getPackageDetails.services[req?.body?.packageCategory.toLowerCase()]) {
                        const serviceDetails = await servicesSchema.findOne({ _id: service.serviceId });
                        const getRemainingQuataDetails = await RemainingServiceQuotaSchema.findOne({ userId: req.data, remainingServicesQuota: { $elemMatch: { "value": service.serviceId } } });
                        if (getRemainingQuataDetails) {
                            const updateQuota = await RemainingServiceQuotaSchema.findOneAndUpdate({ userId: req.data, "remainingServicesQuota.value": service.serviceId }, {
                                $inc: { "remainingServicesQuota.$.quota": Number(service.quota || 0) }, $set: {
                                    deliveryQuota: (req?.body?.packageCategory).toLowerCase() == "s" ? Number(packdata[0]?.S_delivery) : (req?.body?.packageCategory).toLowerCase() == "m" ? Number(packdata[0]?.M_delivery) : (req?.body?.packageCategory).toLowerCase() == "l" ? Number(packdata[0]?.L_delivery) : 0
                                }
                            }, { returnDocument: "after" });
                        } else {
                            const updatedQuota = await RemainingServiceQuotaSchema.findOneAndUpdate({ userId: req.data }, {
                                $push: {
                                    "remainingServicesQuota": {
                                        "quota": Number(service.quota),
                                        "value": service.serviceId,
                                        "serviceName": serviceDetails.serviceName_EN
                                    }
                                },
                                $set: {
                                    deliveryQuota: (req?.body?.packageCategory).toLowerCase() == "s" ? Number(packdata[0]?.S_delivery) : (req?.body?.packageCategory).toLowerCase() == "m" ? Number(packdata[0]?.M_delivery) : (req?.body?.packageCategory).toLowerCase() == "l" ? Number(packdata[0]?.L_delivery) : 0
                                }
                            }, { returnDocument: "after" })
                        }
                    }
                } else {
                    let finalQuata = [];
                    for (const package of packdata[0].services[(req?.body?.packageCategory).toLowerCase()]) {
                        let serviceDetails = await servicesSchema.findOne({ _id: package?.serviceId });
                        let obj = {
                            quota: package?.quota || 0,
                            value: package.serviceId,
                            serviceName: serviceDetails?.serviceName_EN
                        }
                        finalQuata.push(obj)
                    }
                    const remainingQuato = await RemainingServiceQuotaSchema.create({
                        userId: req?.data,
                        packageId: packdata[0]?._id,
                        buyPackageId: packageUser?._id,
                        remainingServicesQuota: finalQuata,
                        deliveryQuota: (req?.body?.packageCategory).toLowerCase() == "s" ? Number(packdata[0]?.S_delivery) : (req?.body?.packageCategory).toLowerCase() == "m" ? Number(packdata[0]?.M_delivery) : (req?.body?.packageCategory).toLowerCase() == "l" ? Number(packdata[0]?.L_delivery) : 0
                    });
                }
            }
            await commonHelper.quotaDeduction(temp)
            if (updatePackage) {
                console.log("Package updated successfully");
                let response = {
                    status: true,
                    message: "Your package update successfully",
                    data: updatePackage,
                };
                return res?.send(response);
            } else {
                console.error("Failed to update package UserID:", req?.data);
                let response = {
                    status: false,
                    message: "Oops somthing went go wrong",
                };
                return res?.send(response);
            }
        } else {
            console.log("No active package found, creating new one...");
            const Data = new BuyPackageSchema(temp);
            Data.save(async (err, data) => {
                if (err) {
                    let response = {
                        status: false,
                        message: err?.message,
                        data: {},
                    };
                    return res?.send(response);
                }
                if (data) {
                    let finalQuata = [];
                    for (const package of packdata[0].services[(req?.body?.packageCategory).toLowerCase()]) {
                        let serviceDetails = await servicesSchema.findOne({ _id: package?.serviceId });
                        let obj = {
                            quota: package?.quota,
                            value: package.serviceId,
                            serviceName: serviceDetails?.serviceName_EN
                        }
                        finalQuata.push(obj)
                    }

                    const remainingQuato = await RemainingServiceQuotaSchema.create({
                        userId: req?.data,
                        packageId: packdata[0]?._id,
                        buyPackageId: data?._id,
                        remainingServicesQuota: finalQuata,
                        deliveryQuota: (req?.body?.packageCategory).toLowerCase() == "s" ? Number(packdata[0]?.S_delivery) : (req?.body?.packageCategory).toLowerCase() == "m" ? Number(packdata[0]?.M_delivery) : (req?.body?.packageCategory).toLowerCase() == "l" ? Number(packdata[0]?.L_delivery) : 0
                    });
                    await commonHelper.quotaDeduction(temp)
                    let response = {
                        status: true,
                        message: "Package Buy Successfully",
                        data: data,
                    };
                    return res.send(response);
                } else {
                    let response = {
                        status: false,
                        message: "Opps something went go wrong ",
                    };
                    return res.send(response);
                }
            });
        }
    } catch (err) {
        console.log({ err: err.message });
        return res.send(err);
    }
});
// router.post("/buy-package", async function (req, res) {
//     try {
//         // Ensure offerDetails is not empty and fetch details
//         const offerDetails = req?.body?.offerDetails
//             ? await offerPromotionSchema.findById(req.body.offerDetails)
//             : null;
//         // Prepare the temp object
//         const temp = {
//             userId: req?.data,
//             packageId: req?.body?.packageId,
//             packageCategory: req?.body?.packageCategory,
//             offerDetails: offerDetails ? JSON.stringify(offerDetails) : null,
//             buyDate: req?.body?.buyDate,
//             subscriptionActive: true
//         };
//         // Get package details with subscription duration
//         const packdata = await subscriptionSchema.aggregate([
//             { $match: { _id: ObjectId(req.body.packageId) } },
//             {
//                 $lookup: {
//                     from: "subscribedurations",
//                     localField: "subcribeDuration",
//                     foreignField: "_id",
//                     as: "subcribeDuration",
//                 },
//             },
//         ]);
//         if (packdata.length === 0) {
//             return res.status(404).send({ status: false, message: "Package not found" });
//         }
//         // Add package duration to packdata
//         packdata[0].duration = packdata[0].subcribeDuration?.[0]?.duration || 0;
//         // Prepare package history
//         const packHistoryTempData = {
//             packageId: req?.body?.packageId,
//             userId: req?.data,
//             buyDate: req?.body?.buyDate,
//             PackageDuration: packdata[0].duration,
//             packageCategory: req?.body?.packageCategory,
//             packagePrice: req?.body?.packageCategory === "S"
//                 ? packdata[0].S_price
//                 : req?.body?.packageCategory === "M"
//                     ? packdata[0].M_price
//                     : packdata[0].L_price,
//         };
//         // Update package history
//         await PackageHistorySchema.updateMany({ userId: req?.data }, { status: 0 });
//         await new PackageHistorySchema(packHistoryTempData).save();
//         // Find an active subscription for the user
//         const packageUser = await BuyPackageSchema.findOne({
//             userId: req?.data,
//             subscriptionActive: true
//         });
//         // Handle package update or new package purchase
//         if (packageUser) {
//             const updatedPackage = await BuyPackageSchema.findOneAndUpdate(
//                 { userId: req?.data },
//                 temp,
//                 { new: true }
//             );
//             if (updatedPackage) {
//                 await handleServiceQuotaUpdate(req, packdata[0], updatedPackage, packageUser);
//                 return res.send({ status: true, message: "Your package updated successfully", data: updatedPackage });
//             }
//         } else {
//             const newPackage = new BuyPackageSchema(temp);
//             await newPackage.save();
//             await handleServiceQuotaCreation(req, packdata[0], newPackage);
//             return res.send({ status: true, message: "Package Buy Successfully", data: newPackage });
//         }
//         return res.send({ status: false, message: "Oops something went wrong" });
//     } catch (err) {
//         console.error(err.message);
//         return res.status(500).send({ status: false, message: err.message });
//     }
// });

// Helper function for updating service quota
async function handleServiceQuotaUpdate(req, packageDetails, updatedPackage, packageUser) {
    const filterData = packageDetails.services[req.body.packageCategory.toLowerCase()].flatMap((v) => v.serviceId);
    const existingQuota = await RemainingServiceQuotaSchema.findOne({ userId: req.data });
    if (existingQuota) {
        // Ensure that the filter operation doesn't remove all entries or create empty records
        const updatedQuota = await RemainingServiceQuotaSchema.findOneAndUpdate(
            { userId: req.data },
            {
                $set: {
                    "remainingServicesQuota": {
                        $filter: {
                            input: "$remainingServicesQuota",
                            as: "item",
                            cond: { $in: ["$$item.value", filterData] }
                        }
                    }
                }
            },
            { new: true }
        );
        const data = await RemainingServiceQuotaSchema.updateMany(
            { userId: req.data },
            {
                $pull: {
                    remainingServicesQuota: {
                        $or: [
                            { quota: { $exists: false } },
                            { value: { $exists: false } },
                            { serviceName: { $exists: false } }
                        ]
                    }
                }
            },
            { new: true }
        );
        // console.log({ data });

        // const remains = existingQuota.remainingServicesQuota.
        for (const service of packageDetails.services[req.body.packageCategory.toLowerCase()]) {
            const serviceDetails = await servicesSchema.findOne({ _id: service.serviceId });
            const existingService = await RemainingServiceQuotaSchema.findOne({
                userId: new ObjectId(req.data),
                "remainingServicesQuota.value": service.serviceId,
            });
            if (existingService) {
                // Update quota if the service already exists
                await RemainingServiceQuotaSchema.findOneAndUpdate(
                    { userId: req.data, "remainingServicesQuota.value": service.serviceId },
                    { $inc: { "remainingServicesQuota.$.quota": service.quota } }
                );
            } else {
                // Push new service only if service details are valid
                await RemainingServiceQuotaSchema.findOneAndUpdate(
                    { userId: req.data },
                    {
                        $push: {
                            "remainingServicesQuota": {
                                quota: service.quota,
                                value: service.serviceId,
                                serviceName: serviceDetails.serviceName_EN
                            }
                        }
                    }, { new: true }
                );
            }
        }
    } else {
        // If no existing quota, create a new one
        await handleServiceQuotaCreation(req, packageDetails, packageUser);
    }
}
// Helper function for creating new service quota
async function handleServiceQuotaCreation(req, packageDetails, packageUser) {
    const finalQuota = [];
    for (const service of packageDetails.services[req.body.packageCategory.toLowerCase()]) {
        const serviceDetails = await servicesSchema.findOne({ _id: service.serviceId });
        // Ensure we have all necessary data before saving
        if (serviceDetails && service.quota && service.serviceId) {
            finalQuota.push({
                quota: service.quota,
                value: service.serviceId,
                serviceName: serviceDetails.serviceName_EN
            });
        }
    }
    // Only save if the finalQuota array is valid and contains complete data
    if (finalQuota.length > 0) {
        console.log({ finalQuota });

        await RemainingServiceQuotaSchema.create({
            userId: req.data,
            packageId: packageDetails._id,
            buyPackageId: packageUser._id,
            remainingServicesQuota: finalQuota
        });
    }
}
// Detail of buyed package of Logg user
router.get("/get-current-pack", async function (req, res) {
    try {
        let deliveryData = 0;
        const data = await BuyPackageSchema.find({ userId: req.data, subscriptionActive: true });
        console.log(data, req.data, 'data')
        const historyData = await PackageHistorySchema.findOne({ packageId: data[0]?.packageId, userId: req.data }).sort({ buyDate: -1 })
        console.log(historyData, 'historyData')
        if (historyData) {
            let packageDetailsData = await subscriptionSchema.findOne({ _id: historyData?.packageId });
            let remainQuota = await RemainingServiceQuotaSchema.findOne({ userId: req.data });
            const orderCount = await placedOrderSchema.find({ userId: req.data, createdAt: { $gte: data[0]?.buyDate, $lte: new Date() } });
            if (packageDetailsData && orderCount.length < packageDetailsData[historyData.packageCategory + "_delivery"]) {
                deliveryData = packageDetailsData[historyData.packageCategory + "_delivery"] - orderCount.length;
            } else {
                deliveryData = 0;
            }
            const remainingQuota = await RemainingServiceQuotaSchema.findOne({ userId: historyData.userId, buyPackageId: data[0]._id }).sort({ createdAt: -1 });
            console.log(remainingQuota, 'remainingQuota')
            const customer = await getOrCreateOmiseCustomer(req.data);
            console.log(customer, 'customer')
            const schedule = await omise.customers.schedules(customer.id, { limit: 10000 });
            const checkAcitvePack = await TransactionSchema.findOne({
                userId: historyData.userId,
                packageId: {
                    $in: data.map(pkg => pkg.packageId)
                }
            }).sort({ createdAt: -1 });
            const currentPackage = await BuyPackageSchema.aggregate([
                {
                    $match: {
                        userId: historyData.userId,
                        packageCategory: { $in: data?.map((_data) => _data.packageCategory) },
                        subscriptionActive: true
                    },
                },
                {
                    $lookup: {
                        from: "subscriptions",
                        foreignField: "_id",
                        localField: "packageId",
                        as: "packageId",
                    },
                },
                {
                    $unwind: {
                        path: "$packageId",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: "subscribedurations",
                        localField: "packageId.subcribeDuration",
                        foreignField: "_id",
                        as: "packageId.subcribeDuration",
                    },
                },
                {
                    $lookup: {
                        from: "services",
                        localField: `packageId.services.${historyData.packageCategory.toLowerCase()}.serviceId`,
                        foreignField: "_id",
                        as: "packageId.services",
                    },
                },
                {
                    $lookup: {
                        from: "items",
                        localField: "packageId.services.item",
                        foreignField: "_id",
                        as: "packageId.item",
                    },
                },
            ]);
            const packageArr = [];
            for (const pack of currentPackage) {
                const obj = {
                    package_Id: "",
                    packageName_EN: "",
                    packageName_TH: "",
                    buyDate: "",
                    subcribeDuration: [],
                    item: [],
                    services: [],
                    description_EN: "",
                    description_TH: "",
                    buyPack: [],
                };
                obj.package_Id += pack?.packageId?._id;
                obj.packageName_EN += pack?.packageId?.packageName_EN;
                obj.packageName_TH += pack?.packageId?.packageName_TH;
                obj.description_EN += pack?.packageId?.description_EN;
                obj.description_TH += pack?.packageId?.description_TH;
                obj.buyDate += pack.buyDate;
                obj.subcribeDuration.push(...pack?.packageId?.subcribeDuration);
                obj.services.push(...pack?.packageId?.services);
                obj.item.push(...pack?.packageId?.item);
                const pack_category = [];
                if (data.find((x) => x?.packageCategory.toUpperCase() == "S")) {
                    // console.log("small pack k array m data put krna h")
                    if (pack?.packageId.S_package_size == data.find((x) => x?.packageCategory.toUpperCase() == "S")?.packageCategory) {
                        const smallPackObj = {};
                        smallPackObj.size = pack?.packageId.S_package_size;
                        smallPackObj.price = pack?.packageId?.S_price;
                        smallPackObj.quantity = pack?.packageId?.S_quantity;
                        smallPackObj.delivery = remainQuota.deliveryQuota;
                        smallPackObj.packDescriptionEN = pack?.packageId?.small_pack_description_EN;
                        smallPackObj.packDescriptionTH = pack?.packageId?.small_pack_description_TH;
                        // smallPackObj.status = checkAcitvePack.paymentType != "card" ? true : schedule.data.find((val) => val.status != "deleted") ? true : false
                        smallPackObj.status = data ? true : false
                        smallPackObj.expireQuota = remainingQuota.remainingServicesQuota.every((val) => val.quota == 0);
                        smallPackObj.Quota = remainingQuota.remainingServicesQuota;
                        pack_category?.push(smallPackObj);
                    }
                }
                if (data.find((x) => x?.packageCategory.toUpperCase() == "M")) {
                    if (pack?.packageId.M_package_size == data.find((x) => x?.packageCategory.toUpperCase() == "M")?.packageCategory) {
                        const mediumPackObj = {};
                        mediumPackObj.size = pack?.packageId.M_package_size;
                        mediumPackObj.price = pack?.packageId?.M_price;
                        mediumPackObj.quantity = pack?.packageId?.M_quantity;
                        mediumPackObj.delivery = remainQuota.deliveryQuota;
                        mediumPackObj.packDescriptionEN = pack?.packageId?.medium_pack_description_EN;
                        mediumPackObj.packDescriptionTH = pack?.packageId?.medium_pack_description_TH;
                        // mediumPackObj.status = checkAcitvePack.paymentType != "card" ? true : schedule.data.find((val) => val.status != "deleted") ? true : false
                        mediumPackObj.status = data ? true : false
                        mediumPackObj.expireQuota = remainingQuota.remainingServicesQuota.every((val) => val.quota == 0);
                        mediumPackObj.Quota = remainingQuota.remainingServicesQuota;
                        pack_category?.push(mediumPackObj);
                    }
                }
                if (data.find((x) => x?.packageCategory.toUpperCase() == "L")) {
                    if (pack?.packageId.L_package_size == data.find((x) => x?.packageCategory.toUpperCase() == "L")?.packageCategory) {
                        const largePackObj = {};
                        largePackObj.size = pack?.packageId.L_package_size;
                        largePackObj.price = pack?.packageId?.L_price;
                        largePackObj.quantity = pack?.packageId?.L_quantity;
                        largePackObj.delivery = remainQuota.deliveryQuota;
                        largePackObj.packDescriptionEN = pack?.packageId?.large_pack_description_EN;
                        largePackObj.packDescriptionTH = pack?.packageId?.large_pack_description_TH;
                        largePackObj.status = data ? true : false;
                        // largePackObj.status = checkAcitvePack.paymentType != "card" ? true : schedule.data.find((val) => val.status != "deleted") ? true : false
                        largePackObj.expireQuota = remainingQuota.remainingServicesQuota.every((val) => val.quota == 0);
                        largePackObj.Quota = remainingQuota.remainingServicesQuota;
                        pack_category?.push(largePackObj);
                    }
                }
                obj.buyPack = pack_category;
                packageArr?.push(obj);
            }
            console.log(packageArr, 'packageArr')
            if (packageArr?.length > 0) {
                let response = {
                    status: true,
                    message: "Detail of buyed package",
                    data: packageArr,
                };
                return res.send(response);
            } else {
                let response = {
                    status: false,
                    message: "No package of this type of category buy by the user",
                };
                return res.send(response);
            }
        } else {
            let response = {
                status: false,
                message: "No package of this type of category buy by the user",
            };
            return res.send(response);
        }
    } catch (err) {
        console.log("running3", err);
        return res.send(err);
    }
});
// Place order deatils api
router.get("/placeOrder-details", async function (req, res) {
    try {
        let driverAreaAssign = {}
        let data = await placedOrderSchema?.findOne({
            userId: req?.data,
            $and: [{
                orderStatus: {
                    $nin: ["cancel(customer)", "cancel(admin)", "cancel(driver)"]
                }
            }],
        }).sort({ createdAt: -1 }).lean();
        if (data) {
            driverAreaAssign = await UserSchema?.findOne({
                _id: data?.pickup_driver,
                isDelete: false,
                role: "driver",
            });
            data = { ...data, driverName: driverAreaAssign?.username, driverMobile: driverAreaAssign?.mobile };
        }
        if (data) {
            let response = {
                status: true,
                message: "order details is here",
                data: [data],
            };
            return res?.send(response);
        } else {
            let response = {
                status: true,
                message: "Oops something wrong please try after some time",
                data: [],
            };
            return res?.send(response);
        }
    } catch (err) {
        console.log({ err })
        return res?.send(err);
    }
});
// order history
router.get("/order-history", async function (req, res) {
    try {
        let response = {};
        let page = Number(req?.query?.page);
        let perPage = Number(req?.query?.perPage);
        let query = {};
        if (page < 0 || page === 0) {
            response = {
                status: false,
                message: "Invalid page number, should start with 1",
            };
            return res?.json(response);
        }
        query.skip = perPage * (page - 1);
        query.limit = perPage;
        placedOrderSchema?.countDocuments({ userId: req?.data }, function (err, totalCount) {
            if (err) {
                response = { status: false, message: "Error fetching data" };
                return res?.send(response);
            }
            placedOrderSchema?.find(
                {
                    userId: req?.data,
                    $or: [
                        { orderStatus: "deliverd" },
                        { orderStatus: { $in: ["cancel(customer)", "cancel(driver)", "cancel(admin)"] } },
                    ],
                },
                {},
                query,
                async function (err, data) {
                    if (err) {
                        response = { status: false, message: "Error fetching data" };
                    } else {
                        let totalPages = Math.ceil(totalCount / perPage);
                        response = {
                            status: true,
                            data: data,
                            pages: totalPages,
                            page: page,
                            perPage: perPage,
                            length: data?.length,
                            // imageUrl: process?.env?.ImageUrl,
                        };
                    }
                    return res?.json(response);
                }
            ).sort({ createdAt: -1 });
        }
        );
    } catch (err) {
        return res?.send(err);
    }
});
// Single order detail
router.get("/single-order-detail", async function (req, res) {
    try {
        const [examineItem, orderdata, rateReview, riseIssue] = await Promise.all([
            ExamineSchema.aggregate([
                { $match: { order_id: { $in: [Number(req.query.orderId)] } } },
                {
                    $lookup: {
                        from: "services",
                        localField: "services",
                        foreignField: "_id",
                        as: "services",
                    },
                },
                {
                    $unwind: {
                        path: "$services",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: "items",
                        localField: "itemName",
                        foreignField: "_id",
                        as: "itemName",
                    },
                },
                {
                    $group: {
                        count: { $sum: 1 },
                        ServicePrice: { $sum: "$$ROOT.servicePrice" },
                        AdditionalServicePrice: { $sum: "$$ROOT.additionalServicePrice" },
                        TotalAmount: { $sum: "$$ROOT.totalPrice" },
                        _id: "$services.serviceName_EN",
                        data: {
                            $push: "$$ROOT",
                        },
                    },
                },
                {
                    $lookup: {
                        from: "services",
                        localField: "additionalServices",
                        foreignField: "_id",
                        as: "additionalServices",
                    },
                },
            ]),
            placedOrderSchema.aggregate([
                { $match: { orderId: Number(req.query.orderId) } },
                {
                    $lookup: {
                        from: "addonservices",
                        localField: "addOnServiceId",
                        foreignField: "_id",
                        let: { addOnServiceId: "$addOnServiceId" },
                        pipeline: [
                            { $match: { $expr: { $in: ["$_id", "$$addOnServiceId"] } } },
                            {
                                $lookup: {
                                    from: "offer&promotions",
                                    localField: "offer",
                                    foreignField: "_id",
                                    as: "offer",
                                },
                            },
                        ],
                        as: "addOnServiceId",
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        foreignField: "_id",
                        localField: "userId",
                        let: { userId: "$userId" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
                            {
                                $lookup: {
                                    from: "dropoffimages",
                                    foreignField: "user_id",
                                    localField: "_id",
                                    as: "dropoffimages",
                                },
                            },
                        ],
                        as: "userId",
                    },
                },
            ]),
            RateReviewSchema.findOne({ order_id: req.query.orderId }),
            RaiseAndIssuesSchema.findOne({ order_id: req.query.orderId }),
        ]);
        const offerData = [];
        for (const getOffer of orderdata) {

            for (const offer of getOffer?.addOnServiceId) {
                const offerObj = {};
                for (const offerDetail of offer.offer) {
                    offerObj.AddOnServiceName = offer.serviceName_EN;
                    offerObj.AddOnServicePrice = offer.price;
                    offerObj.offerType = offerDetail.offer_type;
                    offerObj.offer = offerDetail.offerAmount;
                    offerObj.PriceAfterOfferDetect =
                        offerDetail.offer_type == "percent"
                            ? offer.price - (offer.price * offerDetail.offerAmount) / 100
                            : offer.price - offerDetail.offerAmount;
                }
                offerData.push(offerObj);
            }
        }
        const dropOffData = [];
        for (const data of orderdata) {
            for (const userData of data.userId) {
                for (const deliverData of userData.dropoffimages) {
                    if (data.orderId == deliverData.order_id) {
                        dropOffData.push(deliverData);
                    }
                }
            }
        }
        const billingData = [];
        for (const data of examineItem) {
            for (const innerdata of data.data) {
                if (innerdata.itemStatus != "rejected") {
                    const billingDataObj = {};
                    billingDataObj.ServiceName = data?._id;
                    billingDataObj.ItemQuantity = data?.count;
                    billingDataObj.ServicePrice = data?.ServicePrice;
                    billingDataObj.AdditionalServicePrice = data?.AdditionalServicePrice;
                    billingDataObj.TotalPrice =
                        data?.ServicePrice + billingDataObj.PriceAfterOffer;
                    billingDataObj.TotalPriceWithAddOnService =
                        data?.ServicePrice +
                        data?.AdditionalServicePrice +
                        offerData[0]?.PriceAfterOfferDetect;
                    billingDataObj.CouponDiscount =
                        offerData[0]?.offer +
                        (offerData[0]?.offerType == "percent" ? "%" : "");
                    billingDataObj.DeliveryCharge = "Free";
                    billingDataObj.AddOnServiceAfterDetactOffer =
                        offerData[0]?.PriceAfterOfferDetect;
                    billingData.push(billingDataObj);
                }
            }
        }
        const response = {
            status: true,
            message: "",
            data: {
                examineItem: examineItem,
                orderdata: orderdata,
                dropOffImage: dropOffData,
                billingData: billingData,
                offer: offerData,
                rateReview: rateReview,
                riseIssue: riseIssue,
                imageUrl: process.env.ImageUrl,
            },
        };
        return res.send(response);
    } catch (err) {
        console.log({ err });
        return res?.send(err);
    }
});
router.get("/package-user-order-detail", async function (req, res) {
    try {
        const [examineItem, orderdata, remainQuta, rateReview, riseIssue] = await Promise.all([
            ExamineSchema.aggregate([
                { $match: { order_id: { $in: [Number(req.query.orderId)] } } },
                {
                    $lookup: {
                        from: "services",
                        localField: "services",
                        foreignField: "_id",
                        as: "services",
                    },
                },
                {
                    $unwind: {
                        path: "$services",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: "items",
                        localField: "itemName",
                        foreignField: "_id",
                        as: "itemName",
                    },
                },
                {
                    $lookup: {
                        from: "services",
                        localField: "additionalServices",
                        foreignField: "_id",
                        as: "additionalServices",
                    },
                },
                {
                    $unwind: {
                        path: "$services",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $group: {
                        count: { $sum: 1 },
                        ServicePrice: { $sum: "$$ROOT.servicePrice" },
                        AdditionalServicePrice: { $sum: "$$ROOT.additionalServicePrice" },
                        TotalAmount: { $sum: "$$ROOT.totalPrice" },
                        _id: "$services.serviceName_EN",
                        data: {
                            $push: "$$ROOT",
                        },
                    },
                },
            ]),
            placedOrderSchema.aggregate([
                { $match: { orderId: Number(req.query.orderId) } },
                {
                    $lookup: {
                        from: "addonservices",
                        localField: "addOnServiceId",
                        foreignField: "_id",
                        let: { addOnServiceId: "$addOnServiceId" },
                        pipeline: [
                            { $match: { $expr: { $in: ["$_id", "$$addOnServiceId"] } } },
                            {
                                $lookup: {
                                    from: "offer&promotions",
                                    localField: "offer",
                                    foreignField: "_id",
                                    as: "offer",
                                },
                            },
                        ],
                        as: "addOnServiceId",
                    },
                },
                {
                    $lookup: {
                        from: "buypackages",
                        localField: "userId",
                        foreignField: "userId",
                        as: "packageUser",
                    },
                },
            ]),
            RemainingServiceQuotaSchema.find({ userId: req.data }),
            RateReviewSchema.findOne({ order_id: req.query.orderId }),
            RaiseAndIssuesSchema.findOne({ order_id: req.query.orderId }),
        ]);
        const offerData = [];
        for (const getOffer of orderdata) {
            for (const offer of getOffer.addOnServiceId) {
                const offerObj = {};
                for (const offerDetail of offer.offer) {
                    offerObj.AddOnServiceName = offer.serviceName_EN;
                    offerObj.AddOnServicePrice = offer.price;
                    offerObj.offerType = offerDetail.offer_type;
                    offerObj.offer = offerDetail.offerAmount;
                    offerObj.PriceAfterOfferDetect =
                        offerDetail.offer_type == "percent"
                            ? offer.price - (offer.price * offerDetail.offerAmount) / 100
                            : offer.price - offerDetail.offerAmount;
                }
                offerData.push(offerObj);
            }
        }
        const billingData = [];
        for (const data of examineItem) {
            for (const innerdata of data.data) {
                if (innerdata.itemStatus != "rejected") {
                    const billingDataObj = {};
                    billingDataObj.ServiceName = data?._id;
                    billingDataObj.ItemQuantity = data?.count;
                    billingDataObj.ServicePrice = data?.ServicePrice;
                    billingDataObj.AdditionalServicePrice = data?.AdditionalServicePrice;
                    billingDataObj.AddOnService = offerData;
                    offerData.forEach((value, key) => {
                        console.log(value.PriceAfterOfferDetect);
                        // return billingDataObj.AddOnService1 = value.PriceAfterOfferDetect
                    });
                    // billingDataObj.PriceAfterOffer = offerData[0].offerType == 'percent' ? (data?.AdditionalServicePrice - (data?.AdditionalServicePrice * offerData[0].offer / 100)) : (data?.AdditionalServicePrice - offerData[0].offer)
                    billingDataObj.PriceAfterOffer =
                        offerData[0].offerType == "percent"
                            ? data?.AdditionalServicePrice -
                            (data?.AdditionalServicePrice * offerData[0].offer) / 100
                            : data?.AdditionalServicePrice - offerData[0].offer;
                    billingDataObj.TotalPrice =
                        data?.ServicePrice + billingDataObj.PriceAfterOffer;
                    billingDataObj.CouponDiscount = billingDataObj.CouponDiscount =
                        offerData[0].offer +
                        (offerData[0].offerType == "percent" ? "%" : "");
                    billingDataObj.DeliveryCharge = "Free";
                    billingData.push(billingDataObj);
                }
            }
        }
        const response = {
            status: true,
            message: "",
            data: {
                examineItem: examineItem,
                orderdata: orderdata,
                remainQuta: remainQuta,
                billingData: billingData,
                offer: offerData,
                rateReview: rateReview,
                riseIssue: riseIssue,
                imageUrl: process.env.ImageUrl,
            },
        };
        return res.send(response);
    } catch (err) {
        return res.send(err);
    }
});
//reason list for customer for order cancel
router.get("/customer-reason-list", async function (req, res) {
    try {
        const customerReasons = await ReasonList.find({
            isDelete: false,
            reasonType: "customer",
        });
        if (customerReasons) {
            let response = {
                status: true,
                message: "Customer reasons here",
                data: customerReasons,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try latter",
            };
            return res?.send(response);
        }
    } catch (err) {
        return res.send(err);
    }
});
//cancel order by the customer
router.post("/customer-cancel-order", async function (req, res) {
    const temp = {
        orderId: req?.body?.orderId,
        cancelType: req?.body?.cancelType,
        reasonId: req?.body?.reasonId,
        description: req?.body?.description,
    };
    const reason = new CancelOrdersSchema(temp);
    reason.save().then(async function (order) {
        const temp = {
            orderId: order?.orderId,
            orderStatus: "cancel(customer)",
            // driverStatus: "cancel(customer)",
            customerRequest: "confirm"
        };
        let update = await placedOrderSchema.findOneAndUpdate(
            { orderId: order?.orderId },
            temp,
            { new: true }
        );
        if (update) {
            let response = {
                status: true,
                message: "Customer cancel this order",
                data: update,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try latter",
                data: {},
            };
            return res?.send(response);
        }
    });
});
//action on item examine issue if item is pending
router.post("/examine-item-request-action", async (req, res) => {
    try {
        const temp = {
            itemStatus: req.body.itemStatus,
        };
        const updatedItem = await examinItemSchema.findByIdAndUpdate(
            req?.body?._id,
            temp,
            { new: true }
        );
        if (updatedItem) {
            let response = {
                status: true,
                message: "Item updated successfully",
                data: updatedItem,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Item not found",
                data: {},
            };
            return res?.send(response);
        }
    } catch (err) {
        return res.send(err);
    }
});
//payment process proceed
router.get("/payment-proceed", async (req, res) => {
    try {
        //status update for payment
        const temp = {
            orderStatus: "inprocess(payment success)",
            paid: true
        };
        const data = await placedOrderSchema.findOneAndUpdate(
            { userId: req?.data, orderId: req.query.orderId },
            temp
        );
        if (data) {
            let response = {
                status: true,
                message: "your payment is proceed",
            };
            return res.send(response);
        } else {
            let response = {
                status: false,
                message: "Network slow",
            };
            return res.send(response);
        }
    } catch (err) {
        return res.send(err);
    }
});
router.post("/rate-review", [body("review").exists().withMessage({
    message: "Please enter review",
}),
body("rate").exists().withMessage({
    message: "Please enter rate",
}),
body("order_id").exists().withMessage({
    message: "Please enter order_id",
}),
],
    async function (req, res) {
        try {
            const errors = validationResult(req);
            if (!errors?.isEmpty()) {
                return res?.status(200).json({
                    status: false,
                    message: errors?.errors[0].msg.message,
                    data: {},
                });
            }
            const temp = {
                review: req?.body?.review,
                rate: req?.body?.rate,
                user_id: req?.data,
                order_id: req?.body?.order_id,
            };
            const newRateReview = new RateReviewSchema(temp);
            newRateReview?.save(async function (err, data) {
                if (err) {
                    let response = { status: false, message: err?.message, data: {} };
                    return res?.send(response);
                }
                if (data) {
                    let response = {
                        status: true,
                        message: "Review successfully created",
                        data: data,
                    };
                    return res?.send(response);
                } else {
                    let response = {
                        status: false,
                        message: "Oops something wrong please try latter",
                    };
                    return res?.send(response);
                }
            });
        } catch (err) {
            return res?.send(err?.message);
        }
    }
);
router.post("/raise-issues", upload?.any("media"), async function (req, res) {
    try {
        let ImagesArray = [];
        if (req?.files && req?.files?.length) {
            ImagesArray = req?.files?.map((ele) => ele?.filename);
        }
        const temp = {
            user_id: req?.data,
            raiseIssue: req?.body?.raiseIssue,
            order_id: req?.body?.order_id,
            media: ImagesArray,
        };

        const newRiseIssues = new RaiseAndIssuesSchema(temp);
        newRiseIssues?.save(async function (err, data) {
            if (err) {
                let response = { status: false, message: err?.message, data: {} };
                return res?.send(response);
            }
            if (data) {
                let response = {
                    status: true,
                    message: "Review successfully created",
                    data: data,
                };
                return res?.send(response);
            } else {
                let response = {
                    status: false,
                    message: "Oops something wrong please try latter",
                };
                return res?.send(response);
            }
        });
    } catch (err) {
        return res?.send(err?.message);
    }
});
//THIS API IS NOT USE IN CUSTOMER APP START
router.get("/cms-list", async function (req, res) {
    try {
        const cms = await cmspageSchema?.find({ isDelete: false });
        if (cms) {
            let response = {
                status: true,
                message: "cms list is here",
                data: cms,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try after some time",
            };
            return res?.send(response);
        }
    } catch (err) {
        return res?.send(err);
    }
});
// AddonService Details api
router.get("/addOnService-detail", async function (req, res) {
    try {
        const data = await AddOnServiceSchema?.find({ _id: req?.query?.id });
        console.log(data);
        if (data) {
            let response = {
                status: true,
                message: "data list is here",
                data: data,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try after some time",
            };
            return res?.send(response);
        }
    } catch (err) {
        return res?.send(err);
    }
});
//THIS API IS NOT USE IN CUSTOMER APP END
/* THEASE API'S ARE NOT IN USE RIGHT NOW ITS ARE IN EXTRA*/
//LOGG USER BUY PACK DETAIL
router.get("/buy-package-detail", async function (req, res) {
    try {
        const PackageCategory = await BuyPackageSchema.aggregate([
            {
                $match: {
                    userId: ObjectId(req.data),
                    subscriptionActive: true,
                    packageCategory: req.query.packageCategory,
                },
            },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "userId",
                    as: "userId",
                },
            },
            {
                $lookup: {
                    from: "subscriptions",
                    foreignField: "_id",
                    localField: "packageId",
                    as: "packageId",
                },
            },
            {
                $unwind: {
                    path: "$packageId",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "subscribedurations",
                    localField: "packageId.subcribeDuration",
                    foreignField: "_id",
                    as: "packageId.subcribeDuration",
                },
            },
            {
                $lookup: {
                    from: "items",
                    localField: "packageId.item",
                    foreignField: "_id",
                    as: "packageId.item",
                },
            },
            {
                $lookup: {
                    from: "services",
                    localField: "packageId.services",
                    foreignField: "_id",
                    as: "packageId.services",
                },
            },
        ]);
        const packageArr = [];
        for (const pack of PackageCategory) {
            const obj = {
                packageName_EN: "",
                packageName_TH: "",
                buyDate: "",
                subcribeDuration: [],
                item: [],
                services: [],
                description_EN: "",
                description_TH: "",
                packageCategory: {
                    SmallPackage: [],
                    MediumPackage: [],
                    LargePackage: [],
                },
            };
            obj.packageName_EN += pack?.packageId?.packageName_EN;
            obj.packageName_TH += pack?.packageId?.packageName_TH;
            obj.description_EN += pack?.packageId?.description_EN;
            obj.description_TH += pack?.packageId?.description_TH;
            obj.buyDate += pack?.packageId?.buyDate;
            obj.subcribeDuration.push(...pack?.packageId?.subcribeDuration);
            obj.services.push(...pack?.packageId?.services);
            obj.item.push(...pack?.packageId?.item);
            const smallPack = [];
            const mediumPack = [];
            const largePack = [];
            if (pack?.packageId.S_package_size == req?.query?.packageCategory) {
                const smallPackObj = {};
                smallPackObj.size = req?.query?.packageCategory;
                smallPackObj.price = pack?.packageId?.S_price;
                smallPackObj.quantity = pack?.packageId?.S_quantity;
                smallPackObj.delivery = pack?.packageId?.S_delivery;
                smallPackObj.packDescriptionEN =
                    pack?.packageId?.small_pack_description_EN;
                smallPackObj.packDescriptionTH =
                    pack?.packageId?.small_pack_description_TH;
                smallPack?.push(smallPackObj);
            }
            if (pack?.packageId.M_package_size == req?.query?.packageCategory) {
                const mediumPackObj = {};
                mediumPackObj.size = req?.query?.packageCategory;
                mediumPackObj.price = pack?.packageId?.M_price;
                mediumPackObj.quantity = pack?.packageId?.M_quantity;
                mediumPackObj.delivery = pack?.packageId?.M_delivery;
                mediumPackObj.packDescriptionEN =
                    pack?.packageId?.medium_pack_description_EN;
                mediumPackObj.packDescriptionTH =
                    pack?.packageId?.medium_pack_description_TH;
                mediumPack?.push(mediumPackObj);
            }
            if (pack?.packageId.L_package_size == req?.query?.packageCategory) {
                const largePackObj = {};
                largePackObj.size = req?.query?.packageCategory;
                largePackObj.price = pack?.packageId?.M_price;
                largePackObj.quantity = pack?.packageId?.M_quantity;
                largePackObj.delivery = pack?.packageId?.M_delivery;
                largePackObj.packDescriptionEN =
                    pack?.packageId?.large_pack_description_EN;
                largePackObj.packDescriptionTH =
                    pack?.packageId?.large_pack_description_TH;
                largePack?.push(largePackObj);
            }
            (obj.packageCategory.SmallPackage = smallPack),
                (obj.packageCategory.MediumPackage = mediumPack),
                (obj.packageCategory.LargePackage = largePack);
            packageArr?.push(obj);
        }
        let response = {
            status: true,
            message: "Detail of buy package",
            data: packageArr,
        };
        return res.send(response);
    } catch (err) {
        return res.send(err);
    }
});
//LOGG USER CURRENT PACKAGE
router.get("/current-pack", async function (req, res) {
    try {
        const data = await BuyPackageSchema.findOne({ userId: req.data, subscriptionActive: true });
        const currentPackage = await BuyPackageSchema.aggregate([
            { $match: { userId: ObjectId(req.data), subscriptionActive: true } },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "userId",
                    as: "userId",
                },
            },
            {
                $lookup: {
                    from: "subscriptions",
                    foreignField: "_id",
                    localField: "packageId",
                    as: "packageId",
                },
            },
            {
                $unwind: {
                    path: "$packageId",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: "subscribedurations",
                    localField: "packageId.subcribeDuration",
                    foreignField: "_id",
                    as: "packageId.subcribeDuration",
                },
            },
            {
                $lookup: {
                    from: "services",
                    localField: "packageId.services",
                    foreignField: "_id",
                    as: "packageId.services",
                },
            },
            {
                $group: {
                    _id: "$packageId.packageName_EN",
                    Current_user: {
                        $push: "$userId",
                    },
                    S_Package: {
                        $push: "$packageId",
                    },
                    M_Package: {
                        $push: "$packageId",
                    },
                    L_Package: {
                        $push: "$packageId",
                    },
                },
            },
        ]);
        if (currentPackage.length > 0) {
            let response = {
                status: true,
                message: "Current package of logged user",
                data: currentPackage,
            };
            return res.send(response);
        } else {
            let response = {
                status: false,
                message: "This user doesn't have any package",
            };
            return res.send(response);
        }
    } catch (err) {
        return res.send(err);
    }
});
/* THEASE API'S ARE NOT IN USE RIGHT NOW ITS ARE IN EXTRA*/
//VAN DRIVER APP API'S START FROM HERE
//van details of assign driver
router.get("/van-detail", async function (req, res) {
    try {
        const [globalSetting, vanDriver] = await Promise.all([
            globalSettingSchema.find(
                {},
                {
                    startPickUpTime: 1,
                    endPickUpTime: 1,
                }
            ),
            UserSchema.findById({ _id: req?.data }).populate([
                "city_id",
                "areaName",
                "vanNo",
            ]),
        ]);
        const response = {
            status: true,
            message: "",
            data: {
                // globalSetting: globalSetting,
                vanDriver: vanDriver,
                imageUrl: process?.env?.ImageUrl,
            },
        };
        return res?.send(response);
    } catch (err) {
        res.send(err);
    }
});
// driver contact us
router.get("/driver-contact", async function (req, res) {
    try {
        const contactDetails = await globalSettingSchema?.find(
            {},
            { email: 1, mobile: 1, address: 1 }
        );
        if (contactDetails) {
            let response = {
                status: true,
                message: "Contact details here",
                data: contactDetails,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try latter",
            };
            return res?.send(response);
        }
    } catch (err) {
        return res?.send(err);
    }
});
//order list of assign driver for pickup order
router.get("/order-list", async function (req, res) {
    try {
        // const orderlist = await placedOrderSchema.find({ pickup_driver: req.data, isDelete: false })
        let lat = 26.8912;
        let long = 75.7689;
        const confirmOrder = await examinItemSchema.find({});
        const driverData = await UserSchema.findOne({ _id: req.data });
        const orderdatatest = await placedOrderSchema.findOne({ _id: req.data });
        console.log("this is the api ")
        console.log(orderdatatest, "orderdatatest")
        const orderdata = await placedOrderSchema?.aggregate([
            // {
            //     $match: {
            //         $and: [
            //             {
            //                 $or: [{ pickup_driver: ObjectId(req?.data) }],
            //             },
            //             {
            //                 orderStatus: { $nin: ["cancel", "inprocess(Examine clothes)", "deliverd", "cancel(customer)", "cancel(admin)", "cancel(driver)"] },
            //             },
            //         ],
            //     },
            // },

            {
                $match: {
                    $or: [
                        {
                            $and: [
                                { pickup_driver: ObjectId(req?.data) },  // Driver assigned for pickup
                                { orderStatus: "readytodelivered" },      // Order status should be readytodelivered
                                {
                                    paymentDate: {
                                        $gte: new Date(new Date().setHours(5, 0, 0, 0)),  // Greater than or equal to 5:00 AM
                                        $lt: new Date(new Date().setHours(8, 0, 0, 0)),   // Less than 8:00 AM
                                    }
                                }
                            ]
                        },
                        {
                            $and: [
                                { pickup_driver: ObjectId(req?.data) },  // Another condition for pickup_driver
                                {
                                    orderStatus: {
                                        $nin: [
                                            "cancel",
                                            "inprocess(Examine clothes)",
                                            "deliverd",
                                            "cancel(customer)",
                                            "cancel(admin)",
                                            "cancel(driver)"
                                        ]  // Exclude specific order statuses
                                    }
                                }
                            ]
                        }
                    ]
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "userId",
                    as: "user",
                },
            },
            { $unwind: "$user" },
            {
                $lookup: {
                    from: "buypackages",
                    localField: "userId",
                    foreignField: "userId",
                    as: "packageUser",
                },
            },
            {
                $lookup: {
                    from: "qrcodes",
                    foreignField: "order_id",
                    localField: "orderId",
                    as: "order_QR",
                },
            },
        ]);
        console.log(orderdata, 'orderdata')
        if (orderdata) {
            let response = {
                status: true,
                message: "Pickup order list is here",
                data: orderdata,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try latter",
            };
            return res?.send(response);
        }
    } catch (err) {
        console.log(err)
        return res?.send(err);
    }
});
//order history
router.get("/driver-order-history", async function (req, res) {
    try {
        let driverId = req?.query?.driverId
        const QueryObj = {
            // $or: [{ pickup_driver: ObjectId(req?.data) }],
            $or: [{ pickup_driver: ObjectId(driverId) }],
            // orderStatus: { $in: ["deliverd", "cancel(customer)", "picked_up"] },
            orderStatus: { $in: ["deliverd", "cancel(customer)", "picked_up"] },
            driverStatus: {
                $in: [
                    "deliverd",
                    "cancel(pickup)",
                    "cancel(deliver)",
                    "cancel(customer)",
                    "pickup",
                    "order_place"
                ],
            },
            // createdAt: { $eq: new Date("2023-04-28T13:01:51.981Z") }
        };
        //  date aa rhi ha ya nhi
        if (req.query.date || req.query.date != "") {
            var filterDate = req?.query?.date;
            const StDate = new Date(filterDate).setHours(0, 0, 0, 0);
            const EnDate = new Date(filterDate).setHours(11, 59, 59, 999);
            const startDate = new Date(new Date(StDate).getTime() + 5000 * 60 * 60 + 30000 * 60);
            const endDate = new Date(new Date(EnDate).getTime() + 5000 * 60 * 60 + 30000 * 60);
            QueryObj.createdAt = {
                $gte: startDate,
                $lt: endDate,
            };
        }
        const orderdata = await placedOrderSchema?.aggregate([
            {
                $match: {
                    $or: [
                        QueryObj,
                        // {
                        //     paid: true
                        // }
                    ]
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "userId",
                    let: { userId: "$userId" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
                        {
                            $lookup: {
                                from: "dropoffimages",
                                foreignField: "user_id",
                                localField: "_id",
                                as: "dropoffimages",
                            },
                        },
                    ],
                    as: "userId",
                },
            },
            {
                $lookup: {
                    from: "qrcodes",
                    foreignField: "order_id",
                    localField: "orderId",
                    as: "order_QR",
                },
            },
        ]);
        if (orderdata) {
            let response = {
                status: true,
                message: "Past order list is here",
                data: orderdata,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try latter",
            };
            return res?.send(response);
        }
    } catch (err) {
        return res?.send(err);
    }
});
//order history detail
router.get("/order-history-detail", async function (req, res) {
    try {
        const QueryData = req?.query?.orderId;
        const orderdataDetail = await placedOrderSchema?.aggregate([
            { $match: { orderId: Number(QueryData) } },
            {
                $lookup: {
                    from: "users",
                    foreignField: "_id",
                    localField: "userId",
                    let: { userId: "$userId" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
                        {
                            $lookup: {
                                from: "dropoffimages",
                                foreignField: "user_id",
                                localField: "_id",
                                as: "dropoffimages",
                            },
                        },
                        // { $match: { "dropoffimages.order_id": Number(QueryData) } },
                    ],
                    as: "userId",
                },
            },
        ]);
        const orderdataDetailArr = [];
        for (const data of orderdataDetail) {
            for (const userData of data.userId) {
                for (const deliverData of userData.dropoffimages) {
                    if (data.orderId == deliverData.order_id) {
                        orderdataDetailArr.push(deliverData);
                    }
                }
            }
        }
        if (orderdataDetail) {
            let response = {
                status: true,
                message: "Past order detail is here",
                data: { orderdataDetail, orderdataDetailArr },
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try latter",
            };
            return res?.send(response);
        }
    } catch (err) {
        return res.send(err);
    }
});
//update order status when driver pickup the order
router.post("/update-order-status", [
    body("orderStatus").exists().withMessage({
        message: "Please enter orderStatus",
    }),
    body("driverStatus").exists().withMessage({
        message: "Please enter driverStatus",
    }),
],
    async function (req, res) {
        try {
            const errors = validationResult(req);
            if (!errors?.isEmpty()) {
                return res.status(200).json({
                    status: false,
                    message: errors?.errors[0]?.msg?.message,
                    data: {},
                });
            }
            const temp = {
                orderStatus: req?.body?.orderStatus,
                driverStatus: req?.body?.driverStatus,
            };
            const updateStatus = await placedOrderSchema?.findOneAndUpdate(
                { orderId: req?.query?.orderId },
                temp,
                { new: true }
            );
            let template = await TemplateSchema?.findOne({ slug: 'order-picked-up' });
            template.description = template?.description?.replace("{orderId}", req?.query?.orderId);
            let admin = await UserSchema.findOne({ role: 'admin' });
            let mailData = {
                email: admin.email,
                subject: template?.title || "",
                html: template?.description || "",
            };
            mailSend(mailData);
            if (updateStatus) {
                let response = {
                    status: true,
                    message: "This order is picked up from the user",
                    data: updateStatus,
                };
                let messageObj = {
                    title: "Cue Laundary order picked up",
                    body: `Order Id:- #${req?.query?.orderId} order picked up .`,
                    types: `${req?.query?.orderId}`,
                };
                const foundOrder = await placedOrderSchema.findOne({
                    orderId: req?.query?.orderId,
                });
                let customer = await UserSchema.findOne({
                    _id: foundOrder.userId,
                    pushNotification: "1",
                });
                const notification = commonHelper?.pushNotificationSendCustomer(
                    customer.FCMToken,
                    messageObj
                );
                return res?.send(response);
            } else {
                let response = {
                    status: false,
                    message: "Oops something wrong please try latter",
                };
                return res?.send(response);
            }
        } catch (error) {
            const response = { status: false, message: error?.message };
            return res?.json(response);
        }
    }
);
//update qr when driver scan and link the order
router.post("/update-QR-code", async (req, res) => {
    try {
        const existData = await QRcodeSchema.findOne({
            _id: ObjectId(req?.body?._id),
        });
        if (existData.order_id == null) {
            let data1 = `${Buffer?.from(existData.QrId?.toString()).toString("base64")}/${Buffer?.from(req.body.order_id?.toString()).toString("base64")}`;
            const QR = await QRCode?.toDataURL(data1);
            const temp = {
                order_id: req.body.order_id,
                // QrImage: QR,
            };
            const data = await QRcodeSchema.findByIdAndUpdate(
                { _id: ObjectId(req?.body?._id) },
                temp,
                { new: true }
            );
            let response = {
                status: true,
                message: "QR code granted a order successfully",
                data: data,
            };
            return res?.send(response);
        } else {
            // console.log("order id k according details show krni h ")
            const data = await placedOrderSchema.findOne({
                orderId: existData.order_id,
            });
            let response = {
                status: false,
                message: "This Qr is already attach with order",
                data: data,
            };
            return res?.send(response);
        }
    } catch (err) {
        return res?.send(err.message);
    }
});
//order list of assign driver for deliver order
router.get("/deliver-orders", async function (req, res) {
    // console.log("deliver order list here")
    try {
        const data = await ExamineSchema?.find({});
        let arr = [];
        data?.map(async (_item, index) => {
            if (moment(_item?.createdAt)?.add(48, "hour") < moment()?.format()) {
                arr?.push(_item);
                let temp = {};
                const updateStatus = await placedOrderSchema?.updateMany(
                    { orderId: _item?.order_id },
                    { orderStatus: "deliver" }
                );
            }
        });
        let orderIds = _.uniq(_.pluck(arr, "order_id"));
        const finalData = await placedOrderSchema?.find({
            $in: { orderId: orderIds },
            orderStatus: "deliver",
        });
        // console.log('finalData', finalData)
        if (finalData) {
            let response = {
                status: true,
                message: "Deliver Order list is here",
                data: finalData,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try latter",
            };
            return res?.send(response);
        }
    } catch (error) {
        return res?.send(error.message);
    }
});
//Marked as deliverd of the order which status is delivery
router.post("/out-for-delivery", async function (req, res) {
    try {
        let Response;
        placedOrderSchema
            .aggregate([{ $match: { orderId: { $in: req?.body?.orderIds } } }])
            .then(async (Orders) => {
                let temp = {
                    orderStatus: "out_for_delivery",
                    driverStatus: "out_for_delivery",
                };
                const updateStatus = await placedOrderSchema?.updateMany(
                    { orderId: { $in: Orders.map((item) => item.orderId) } },
                    temp,
                    { new: true }
                );

                if (updateStatus.modifiedCount > 0) {
                    const users = await userSchema.findOne({ _id: { $in: Orders.map((order) => order.userId) }, pushNotification: "1" });
                    if (users && user.FCMToken) {
                        let messageObj = {
                            title: "Cue Laundary",
                            body: `Payment sucessfully complated.`,
                            // types: `${data.orderId}`,
                        };
                        commonHelper?.pushNotificationSendCustomer(
                            customer?.FCMToken,
                            messageObj
                        );
                    }
                    let response = {
                        status: true,
                        message: "Order successfully added for mark as deliver ",
                    };
                    return res?.send(response);
                } else {
                    let response = {
                        status: false,
                        message: "Order not added for mark as deliver",
                    };
                    return res?.send(response);
                }
            });
    } catch (err) {
        return res.send(err);
    }
});
//deliver time drop off images by the driver
router.post("/deliver-drop-off-image", upload.any("dropOffImage"), async function (req, res) {

    let documentArray = [];
    if (req?.files && req?.files?.length > 0) {
        documentArray = req?.files?.map((ele) => ele?.filename);
    } else {
        let response = {
            status: false,
            message: "Please add drop-off images.",
            data: {},
        };
        return res?.send(response);
    }
    const dropOffData = new DropOffImageSchema({
        user_id: req?.body?.user_id,
        order_id: req?.body?.order_id,
        dropOffImage: documentArray,
    });
    dropOffData.save().then(async function (order) {
        const temp = {
            orderId: order?.order_id,
            orderStatus: "deliverd",
            driverStatus: "deliverd",
            dropOff_driver: req?.data,
        };
        let update = await placedOrderSchema.findOneAndUpdate(
            { orderId: order?.order_id },
            temp,
            { new: true }
        );
        const user = await userSchema.findOne({ _id: req?.body?.user_id, pushNotification: "1" });
        if (user && user.FCMToken) {
            let messageObj = {
                title: "Cue Laundary",
                body: `Order deliverd successfully.`,
                // types: `${data.orderId}`,
            };
            commonHelper?.pushNotificationSendCustomer(
                customer?.FCMToken,
                messageObj
            );
        }
        if (update) {
            let response = {
                status: true,
                message: "Driver successfully deliverd this order",
                data: update,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try latter",
                data: {},
            };
            return res?.send(response);
        }
    });
});
// Update driver lat long for tracking order
router.post("/update-lat-long", async function (req, res) {
    try {
        const temp = {
            location: req?.body?.location,
        };
        const data = await UserSchema.findByIdAndUpdate(
            { _id: req?.data, role: "driver" },
            temp,
            { new: true }
        );
        let response = {
            status: true,
            message: "",
            data: data,
        };
        return res?.send(response);
    } catch (error) {
        const response = { status: false, message: error?.message };
        return res?.json(response);
    }
});
//scan qr code and get bulk order list
router.get("/scan-QR", async function (req, res) {
    try {
        const QRData1 = await QRcodeSchema.findOne({ _id: req?.query?.id });
        if (!QRData1) {
            let response = {
                staus: false,
                message: "This Qr code is not attach with any order",
            };
            return res?.send(response);
        } else {
            const orderdata = await placedOrderSchema?.aggregate([
                { $match: { orderId: Number(QRData1?.order_id) } },
                {
                    $lookup: {
                        from: "users",
                        foreignField: "_id",
                        localField: "userId",
                        as: "userId",
                    },
                },
            ]);
            const vanDetails = await UserSchema?.findOne({
                role: "driver",
                _id: orderdata[0]?.pickup_driver,
            }).populate(["vanNo"]);
            if (req.data == orderdata[0]?.pickup_driver) {
                // console.log("order isi driver ka h ")
                let response = {
                    status: true,
                    message: "Order is belong to this driver",
                    data: orderdata,
                };
                return res?.send(response);
            } else {
                let response = {
                    status: false,
                    message: "Order is not belong to this driver",
                    data: vanDetails,
                };
                return res?.send(response);
            }
        }
    } catch (err) {
        return res.send(err);
    }
});
//search order according to order id,username,mobile
router.get("/get-search-order", async function (req, res) {
    let searchItem = req?.query?.searchItem;
    let searchQuery = {};
    if (searchItem) {
        searchQuery.$or = [
            {
                convertedOrderId: {
                    $regex: new RegExp(".*" + searchItem?.trim() + ".*", "i"),
                },
            },
            {
                "userId.username": {
                    $regex: new RegExp(".*" + searchItem?.trim() + ".*", "i"),
                },
            },
            {
                "userId.mobile": {
                    $regex: new RegExp(".*" + searchItem?.trim() + ".*", "i"),
                },
            },
        ];
    }
    searchQuery.isDelete = false;
    const data = await placedOrderSchema?.aggregate([
        {
            $addFields: {
                convertedOrderId: { $toString: "$orderId" },
            },
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "userId",
                as: "user",
            },
        },
        { $unwind: "$user" },
        {
            $lookup: {
                from: "buypackages",
                localField: "userId",
                foreignField: "userId",
                as: "packageUser",
            },
        },
        {
            $lookup: {
                from: "qrcodes",
                foreignField: "order_id",
                localField: "orderId",
                as: "order_QR",
            },
        },
        { $match: { $and: [{ pickup_driver: ObjectId(req?.data) }, searchQuery] } },
    ]);
    if (data.length > 0) {
        let response = {
            status: true,
            message: "Order is here",
            data: data,
        };
        return res?.send(response);
    } else {
        let response = {
            status: true,
            message: "No order found",
            data: data,
        };
        return res?.send(response);
    }
});
//driver order cancel when pickup the order
router.post("/pickup-cancel-order", async function (req, res) {
    const temp = {
        orderId: req?.body?.orderId,
        description: req?.body?.description,
    };
    //status bhi update krna h isme
    const cancelOrder = new CancelOrdersSchema(temp);
    cancelOrder.save().then(async function (order) {
        const temp = {
            orderId: order?.orderId,
            orderStatus: "cancel(driver)",
            // driverStatus: "cancel(pickup)",
        };
        let update = await placedOrderSchema.findOneAndUpdate({ orderId: order?.orderId }, temp, { new: true });
        if (update) {
            let template = await TemplateSchema?.findOne({ slug: 'order-cancelled-by-driver' });
            template.description = template?.description?.replace("{orderId}", order?.orderId);
            let admin = await UserSchema.findOne({ role: 'admin' });
            let mailData = {
                email: admin.email,
                subject: template?.title || "",
                html: template?.description || "",
            };
            mailSend(mailData);
            let response = {
                status: true,
                message: "Driver cancel this order",
                data: update,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try latter",
                data: {},
            };
            return res?.send(response);
        }
    });
});
//driver reason list
router.get("/driver-reason-list", async function (req, res) {
    try {
        const driverReasons = await ReasonList.find({
            isDelete: false,
            reasonType: "driver",
        });
        if (driverReasons) {
            let response = {
                status: true,
                message: "Driver reasons here",
                data: driverReasons,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try latter",
            };
            return res?.send(response);
        }
    } catch (err) {
        return res.send(err);
    }
});
//order not deliver by driver and gives reason
router.post("/deliver-cancel-order", async function (req, res) {
    const temp = {
        orderId: req?.body?.orderId,
        cancelType: req?.body?.cancelType,
        reasonId: req?.body?.reasonId,
        description: req?.body?.description,
    };
    const reason = new CancelOrdersSchema(temp);
    reason.save().then(async function (order) {
        const temp = {
            orderId: order?.orderId,
            orderStatus: "cancel(driver)",
            // driverStatus: "cancel(deliver)",
        };
        let update = await placedOrderSchema.findOneAndUpdate({ orderId: order?.orderId }, temp, { new: true });
        if (update) {
            let response = {
                status: true,
                message: "Driver cancel this order for deliverd",
                data: update,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try latter",
                data: {},
            };
            return res?.send(response);
        }
    });
});
//driver home(this api is not completed)
router.get("/driver-home", async function (req, res) {
    try {
        let driver = await UserSchema.aggregate([
            { $match: { _id: ObjectId(req?.data) } },
            {
                $lookup: {
                    from: "areas",
                    localField: "areaName",
                    foreignField: "_id",
                    as: "areaName",
                },
            },
            // { $unwind: "$areaName" }
        ]);
        for (const driverdata of driver) {
            // driver
            const address = await AddressSchema?.find({
                isDelete: false,
                area_id: driverdata?.areaName,
            });
            // console.log("address data is here", address)
        }
        // const [aboutUs, sliders, globalSetting, services] = await Promise.all([
        //   homeAboutUsSchema.find({ status: 1 }).select("-__v -isDelete"),
        //   appHomeSlider.find({ status: 1 }).select("-__v -isDelete"),
        //   globalSettingSchema.find(
        //     {},
        //     {
        //       home_title_aboutUs_EN: 1,
        //       home_title_aboutUs_TH: 1,
        //       regularTitle_EN: 1,
        //       regularTitle_TH: 1,
        //       regularSubTitle_EN: 1,
        //       regularSubTitle_TH: 1,
        //       regularImage: 1,
        //       packageTitle_EN: 1,
        //       packageTitle_TH: 1,
        //       packageSubTitle_EN: 1,
        //       packageSubTitle_TH: 1,
        //       packageImage: 1,
        //       how_to_use_our_service_imageEN: 1,
        //       how_to_use_our_service_imageTH: 1,
        //       place_order_imageEN: 1,
        //       place_order_imageTH: 1,
        //     }
        //   ),
        //   servicesSchema.aggregate([
        //     {
        //       $match: { status: 1 },
        //     },
        //     {
        //       $lookup: {
        //         from: "items",
        //         localField: "item",
        //         foreignField: "_id",
        //         as: "items",
        //       },
        //       $lookup: {
        //         from: "units",
        //         localField: "unit",
        //         foreignField: "_id",
        //         as: "units",
        //       },
        //     },
        //   ]),
        // ]);
        // const response = {
        //   status: true,
        //   message: "",
        //   data: {
        //     sliders: sliders,
        //     services: services,
        //     aboutUs: aboutUs,
        //     globalSetting: globalSetting,
        //     imageUrl: process.env.ImageUrl
        //   },
        // };
        // return res.send(response);
    } catch (error) {
        const response = { status: false, message: error?.message };
        res.json(response);
    }
});
//all orders-list which one is placed for pickup by the user
router.get("/order-status-list", async function (req, res) {
    try {
        const orders = await placedOrderSchema.find({
            orderStatus: req?.query?.orderStatus,
        });
        if (orders) {
            let response = {
                status: true,
                message: "Order list is here",
                data: orders,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try latter",
            };
            return res?.send(response);
        }
    } catch (error) {
        const response = { status: false, message: error?.message };
        return res?.json(response);
    }
});
// Chat API
router.get("/fatch-chat/:id", async function (req, res) {
    try {
        const chatList = await chatSchema.aggregate([
            { $match: { order_id: Number(req?.params?.id) } },
        ]);
        let myChat = [];
        for (let data of chatList) {
            const currentDate = data.createdAt.toDateString();
            let found = false;
            for (const chat of myChat) {
                if (chat.title === currentDate) {
                    found = true;
                    chat?.data?.push(data);
                }
            }
            if (!found) {
                myChat.push({
                    title: currentDate,
                    data: [data],
                });
            }
        }
        if (chatList) {
            let response = {
                status: true,
                message: "Order list is here",
                data: myChat,
            };
            return res?.send(response);
        } else {
            let response = {
                status: false,
                message: "Oops something wrong please try latter",
            };
            return res?.send(response);
        }
    } catch (error) {
        console.log(error, "error");
        const response = { status: false, message: error?.message };
        return res?.json(response);
    }
});
// Verify Otp API
router.post("/verify-phone-otp", [
    body("mobile").exists().withMessage({
        message: "Please enter mobile",
    }),
    body("otp").exists().withMessage({
        message: "Please enter otp",
    }),
    body("id").exists().withMessage({
        message: "Please enter Id",
    }),
],
    async (req, res) => {
        const lang = req?.get("Accept-Language");
        const messages = lang == 1 ? messages_en : messages_th;
        // For Error
        const errors = validationResult(req);
        if (!errors?.isEmpty()) {
            return res?.status(200)?.json({
                status: false,
                message: errors?.errors[0]?.msg?.message,
                data: {},
            });
        }
        let updateData = {
            otp: null,
            otpStatus: false,
            mobile: req.body.mobile,
        };
        UserSchema?.findOneAndUpdate({
            _id: req.body.id,
            otp: req?.body?.otp,
            isDelete: false,
        },
            updateData,
            { returnDocument: "after" },
            (err, result) => {
                if (err) throw err;
                if (!result) {
                    let response = {
                        status: false,
                        message: messages?.invalidOtp,
                        data: {},
                    };
                    return res?.send(response);
                } else {
                    let response = {
                        status: true,
                        message: messages?.otpVerifySuccessfully,
                        data: result?._id,
                    };
                    return res?.send(response);
                }
            }
        );
    }
);
/**
 * Add Color API
 */
router.post("/add-color", async (req, res) => {
    try {
        const color = ["Red", "#FF0000",
            "Lime", "#00FF00",
            "Blue", "#0000FF",
            "Yellow", "#FFFF00",
            "Magenta", "#FF00FF",
            "Cyan", "#00FFFF",
            "Orange", "#FFA500",
            "Purple", "#800080",
            "Teal", "#008080",
            "Gray", "#808080",
            "Maroon", "#800000",
            "Green", "#008000",
            "Navy", "#000080",
            "Pink", "#FFC0CB",
            "Gold", "#FFD700",
            "Brown", "#A52A2A",
            "Spring Green", "#00FF7F",
            "Light Sea Green", "#20B2AA",
            "Medium Turquoise", "#48D1CC",
            "Sky Blue", "#87CEEB",
            "Lime Green", "#32CD32",
            "Blue Violet", "#8A2BE2",
            "Crimson", "#DC143C",
            "Royal Blue", "#4169E1",
            "Dark Turquoise", "#00CED1",
            "Saddle Brown", "#8B4513",
            "Dark Slate Gray", "#2F4F4F",
            "Lawn Green", "#7CFC00",
            "Dark Orchid", "#9932CC",
            "Deep Pink", "#FF1493",
            "Indigo", "#4B0082",
            "Orange Red", "#FF4500",
            "Dark Olive Green", "#556B2F",
            "Tomato", "#FF6347",
            "Turquoise", "#40E0D0",
            "Orchid", "#DA70D6",
            "Goldenrod", "#DAA520",
            "Forest Green", "#228B22",
            "Fire Brick", "#B22222",
            "Steel Blue", "#4682B4",
            "Slate Blue", "#6A5ACD",
            "Dark Cyan", "#008B8B",
            "Chocolate", "#D2691E",
            "Medium Slate Blue", "#7B68EE",
            "Dark Orchid", "#9932CC",
            "Dark Orange", "#FF8C00",
            "Medium Spring Green", "#00FA9A",
            "Medium Turquoise", "#48D1CC",
            "Green Yellow", "#ADFF2F",
            "Gold", "#FFD700",
            "Dark Red", "#8B0000",
            "Lime Green", "#32CD32",
            "Orange Red", "#FF4500",
            "Turquoise", "#40E0D0",
            "Blue Violet", "#8A2BE2",
            "Purple", "#800080",
            "Medium Spring Green", "#00FA9A",
            "Deep Sky Blue", "#00BFFF",
            "Light Sea Green", "#20B2AA",
            "Light Coral", "#F08080",
            "Medium Violet Red", "#C71585",
            "Teal", "#008080",
            "Lawn Green", "#7CFC00",
            "Dark Orchid", "#9932CC",
            "Deep Pink", "#FF1493",
            "Spring Green", "#00FF7F",
            "Lime Green", "#32CD32",
            "Gold", "#FFD700",
            "Dark Slate Gray", "#2F4F4F",
            "Purple", "#800080",
            "Light Sea Green", "#20B2AA",
            "Medium Turquoise", "#48D1CC",
            "Tomato", "#FF6347",
            "Chocolate", "#D2691E",
            "Cyan", "#00FFFF",
            "Dark Cyan", "#008B8B",
            "Saddle Brown", "#8B4513",
            "Dark Olive Green", "#556B2F",
            "Hot Pink", "#FF69B4",
            "Slate Blue", "#6A5ACD",
            "Dark Red", "#8B0000",
            "Lime Green", "#32CD32",
            "Spring Green", "#00FF7F",
            "Dark Magenta", "#8B008B",
            "Light Sea Green", "#20B2AA",
            "Medium Turquoise", "#48D1CC",
            "Medium Violet Red", "#C71585",
            "Slate Blue", "#6A5ACD",
            "Cyan", "#00FFFF",
            "Dark Orchid", "#9932CC",
            "Saddle Brown", "#8B4513",
            "Dark Olive Green", "#556B2F",
            "Deep Pink", "#FF1493",
            "Lawn Green", "#7CFC00",
            "Chocolate", "#D2691E",
            "Lime Green", "#32CD32",
            "Orange Red", "#FF4500",
            "Turquoise", "#40E0D0",
            "Tomato", "#FF6347",
            "Medium Spring Green", "#00FA9A"];
        for (let index = 0; index < color.length; index += 2) {
            if (index == 0) {
                let obj = {
                    "name": color[0],
                    "colorCode": color[1],
                }
                await colorSchema.create(obj);
            } else {
                let obj = {
                    "name": color[index],
                    "colorCode": color[index + 1],
                }
                await colorSchema.create(obj);
            }
        }
        return res.json({
            status: true
        });
    } catch (error) {
        console.log(error.message)
    }
}
);
// common functions API
const errorResponse = (message) => {
    let response = {
        status: false,
        message: message,
        data: {},
    };
};
/**
 * 
 * @param {*} email 
 * @param {*} role 
 * @param {*} slug 
 * @returns 
 */
const sendMail = async (email, role, slug) => {
    let otp = commonHelper?.generateOTP();
    await UserSchema?.updateOne({ email: email, role: role, isDelete: false }, {
        otp: otp,
        otpStatus: true,
    }
    );
    let template = await TemplateSchema?.findOne({ slug: slug });
    template.description = template?.description?.replace("{otp}", otp);
    let mailData = {
        email: email,
        subject: template?.title || "",
        html: template?.description || "",
    };
    mailSend(mailData);
    return otp;
};
/************************** this api base of project *********************/
router.get("/single-order-detail-second", async function (req, res) {
    try {

        let getDate = await placedOrderSchema.findOne({ orderId: req.query.orderId });
        const customData = await placedOrderSchema.aggregate([{
            $facet: {
                confirmOrder: [
                    { $match: { orderId: { $eq: Number(req.query.orderId) } } },
                    {
                        $lookup: {
                            from: "bagschemas",
                            localField: "bagId",
                            foreignField: "_id",
                            let: {
                                serviceType: "$serviceType"
                            },
                            pipeline: [
                                {
                                    $lookup: {
                                        from: "services",
                                        localField: "serviceType",
                                        foreignField: "_id",
                                        as: "service"
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "units",
                                        localField: "service.unit",
                                        foreignField: "_id",
                                        as: "units"
                                    }
                                },
                                {
                                    $unwind: "$service"
                                },
                                {
                                    $unwind: "$units"
                                },
                                { $unwind: "$item" },
                                {
                                    $lookup: {
                                        from: "items",
                                        localField: "item.itemId",
                                        foreignField: "_id",
                                        as: "item.itemDetails"
                                    }
                                },
                                { $unwind: "$item.itemDetails" },
                                {
                                    $lookup: {
                                        from: "items",
                                        localField: "item.itemId",
                                        foreignField: "_id",
                                        as: "data"
                                    }
                                },
                                {
                                    $lookup: {
                                        from: "colorschemas",
                                        localField: "item.colorIds",
                                        foreignField: "_id",
                                        as: "colors"
                                    }
                                }
                            ],
                            as: "bags"
                        }
                    },
                    {
                        $unwind: {
                            path: "$bags"
                        }
                    },
                    {
                        $project: {
                            bags: {
                                serviceId: "$bags.service._id",
                                bagId: "$bags._id",
                                service: "$bags.service.serviceName_EN",
                                item: "$bags.item",
                                picture: "$bags.item.picture",
                                unit: "$bags.units.title_EN",
                                quota: "$bags.data",
                                numberOfPacket: { $size: "$bagId" }
                            },
                            unitValue: "$bags.unitValue",
                            servicePrice: "$bags.service.price"
                        }
                    },
                    {
                        $group: {
                            _id: { bagId: "$bags.bagId", serviceId: "$bags.serviceId", serviceName: "$bags.service" },
                            item: { $push: "$bags.item" },
                            unit: { $first: "$bags.unit" },
                            unitValue: { $first: "$unitValue" },
                            picture: { $first: "$bags.picture" },
                            servicePrice: { $first: "$servicePrice" },
                            numberOfPacket: { $first: "$bags.numberOfPacket" }
                        }
                    }
                ],
                addonServices: [
                    { $match: { orderId: { $eq: Number(req.query.orderId) } } },
                    {
                        $lookup: {
                            from: "addonservices",
                            localField: "addOnServiceId",
                            foreignField: "_id",
                            pipeline: [{
                                $lookup: {
                                    from: "offer&promotions",
                                    localField: "offer",
                                    foreignField: "_id",
                                    as: "offerData"
                                }
                            }, {
                                $unwind: "$offerData"
                            }],
                            as: "addonService"
                        }
                    }, {
                        $unwind: "$addonService"
                    }, {
                        $project: {
                            addonServiceDetails: {
                                $function: {
                                    body: function (jsonString) {
                                        try {
                                            return jsonString ? JSON.parse(jsonString) : {};
                                        } catch (e) {
                                            return {};
                                        }
                                    },
                                    args: ["$addOnServiceDetail"],
                                    lang: "js"
                                }
                            },
                            addonService: "$addonService.serviceName_EN",
                            price: "$addonService.price",
                            offer: "$addonService.offerData",
                            offerDiscountPrice: {
                                $cond: [
                                    { $eq: ["$addonService.offerData.offer_type", "percent"] },
                                    { $multiply: ["$addonService.price", { $subtract: [1, { $divide: ["$addonService.offerData.offerAmount", 100] }] }] },
                                    {
                                        $cond: [
                                            { $eq: ["$addonService.offerData.offer_type", "flat"] },
                                            { $subtract: ["$addonService.price", "$addonService.offerData.offerAmount"] },
                                            {
                                                $cond: [
                                                    { $eq: ["$addonService.offerData.offer_type", "free_delivery"] },
                                                    "$addonService.price",
                                                    "$addonService.price"
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                ]
            }
        }]);
        // const packageDetails = await BuyPackageSchema.findOne({ userId: req.data, buyDate: { $lte: getDate?.createdAt } });
        let packageDetails = await BuyPackageSchema.findOne({ userId: req.data, subscriptionActive: true });

        // ensure package history exists
        console.log(packageDetails, 'packageDetails')
        console.log(req.data, 'req.data')
        if (packageDetails) {
            let historyCheck = await PackageHistorySchema.findOne({ packageId: packageDetails.packageId, userId: req.data, status: 1 });
            console.log(historyCheck, 'historyCheck')
            if (!historyCheck) {
                packageDetails = null;
            }
        }
        const globalSetting = await globalSettingSchema.findOne({});
        customData[0]["totalSumAmount"] = 0;
        customData[0]["billingDetails"] = [];
        customData[0]["package"] = packageDetails ? true : false;
        console.log(customData, 'customData')
        // CHeck Free delivery
        if (packageDetails) {
            const orderCount = await placedOrderSchema.find({ userId: req.data, createdAt: { $gte: packageDetails.buyDate, $lte: new Date() } });
            if (orderCount.length > 0) {
                let historyPackage = await PackageHistorySchema.findOne({ packageId: packageDetails.packageId, userId: req.data, status: 1 });
                let packageDetailsData = await subscriptionSchema.findOne({ _id: historyPackage.packageId });
                console.log({ packageDetailsData });

                if (packageDetailsData && orderCount.length < packageDetailsData[historyPackage.packageCategory + "_delivery"]) {
                    customData[0]["deliveryCharges"] = "FREE";
                } else {
                    customData[0]["deliveryCharges"] = Number(globalSetting?.deliveryFee);
                }
            }
        } else {
            customData[0]["deliveryCharges"] = 0;
            customData[0]["exceedQouta"] = []
            for (const _order of customData[0]["confirmOrder"]) {
                let totalAmount = 0
                for (const _item of _order.item) {
                    _item.isShowPrice = true
                }
                if (_order.unit === 'pcs') {
                    let countItem = 0;
                    for (const _item of _order.item) {
                        if (_item.itemStatus == "rejected") {
                            countItem++;
                        }
                        _item.itemDetails.price = _order.servicePrice
                    }
                    totalAmount += (_order.servicePrice * (_order.item.length - countItem))
                } else if (_order.unit === 'kg') {
                    let countItem = 0;
                    for (const _item of _order.item) {
                        if (_item.itemStatus == "rejected") {
                            countItem++;
                        }
                        _item.itemDetails.price = (_order.servicePrice * Number(_order.unitValue))//_order.servicePrice
                    }
                    totalAmount += (_order.servicePrice * Number(_order.unitValue))
                } else if (_order?.unit?.toLowerCase() === 'item') {
                    for (const _item of _order.item) {
                        if (_item.itemStatus !== "rejected") {
                            totalAmount += _item.itemDetails.price
                        }
                    }
                }
                customData[0]["totalSumAmount"] += totalAmount
                customData[0]["billingDetails"].push({
                    _id: _order._id.serviceName,
                    totalAmount,
                    unit: _order.unit,
                    docCount: _order.item.length
                })
            }
        }
        // Check Item Quata & Pricing
        if (packageDetails) {
            let historyPackage = await PackageHistorySchema.findOne({ packageId: packageDetails.packageId, userId: req.data, status: 1 });
            if (!historyPackage) {
                return res.json({
                    status: false,
                    data: "Package history not found"
                });
            }
            let buyDate = new Date(historyPackage.buyDate);
            let expireDate = new Date(buyDate.setMonth(buyDate.getMonth() + historyPackage.PackageDuration));
            if (new Date(expireDate) >= new Date()) {
                const remainingQuato = await RemainingServiceQuotaSchema.findOne({ buyPackageId: packageDetails._id, userId: req.data });
                const subscription = await subscriptionSchema.findOne({ _id: historyPackage.packageId });
                const exceedQuota = []
                const confirmOrder = []
                const billingDetails = []
                if (subscription) {
                    let dataCount = 0;
                    for (const _data of customData[0].confirmOrder) {
                        if (subscription.services[historyPackage.packageCategory.toLowerCase()].find((val) => val.serviceId.toString() === _data._id.serviceId.toString())) {
                            if (remainingQuato.remainingServicesQuota.find((val) => val.value.toString() == _data._id.serviceId.toString())?.quota <= 0) {
                                const obj = {
                                    ..._data,
                                    _id: _data._id.serviceName,
                                    itemUnit: _data.unit,
                                    items: _data.item.filter(v => v.addonService == true)
                                }
                                let totalAmount = 0
                                if (_data.unit === 'pcs') {
                                    let countItem = 0;
                                    for (const _item of _data.item) {
                                        if (_item.itemStatus == "rejected") {
                                            countItem++;
                                        }
                                        _item.itemDetails.price = _data.servicePrice
                                    }
                                    totalAmount += (_data.servicePrice * (_data.item.filter(v => v.addonService == true).length - countItem))
                                } else if (_data.unit === 'kg') {
                                    let countItem = 0;
                                    for (const _item of _data.item) {
                                        if (_item.itemStatus == "rejected") {
                                            countItem++;
                                        }
                                        _item.itemDetails.price = _data.servicePrice
                                    }
                                    totalAmount += (_data.servicePrice * Number(_data.unitValue))
                                } else if (_data?.unit?.toLowerCase() === 'item') {
                                    for (const _item of _data.item) {
                                        if (_item.itemStatus != "rejected") {
                                            // totalAmount += _item.itemDetails.price;
                                            totalAmount += _item.itemDetails.price - Number(globalSetting.packageItemOff / 100 * (_item.itemDetails.price))
                                        }
                                    }
                                }
                                for (const _item of _data.item) {
                                    if (_item.addonService) {
                                        _item.isShowPrice = true
                                    } else {
                                        _item.isShowPrice = false
                                    }
                                }
                                customData[0]["totalSumAmount"] += totalAmount
                                customData[0]["billingDetails"].push({
                                    _id: _data._id.serviceName,
                                    totalAmount,
                                    unit: _data.unit,
                                    docCount: _data.item.length
                                })
                                delete obj.item
                                delete obj.numberOfPacket
                                delete obj.unit
                                if (_data.item.some(v => v.addonService == false)) {
                                    let finalData = { ..._data, item: [..._data.item] };
                                    finalData.item = finalData.item.filter(v => v.addonService == false);
                                    confirmOrder.push(finalData);
                                }
                                if (_data.item.some(v => v.addonService == true)) {
                                    exceedQuota.push(obj)
                                }
                            } else {
                                confirmOrder.push(_data)
                            }
                        } else {
                            let totalAmount = 0
                            if (_data.unit === 'pcs') {
                                let countItem = 0;
                                for (const _item of _data.item) {
                                    if (_item.itemStatus == "rejected") {
                                        countItem++;
                                    }
                                    _item.itemDetails.price = _data.servicePrice
                                }
                                totalAmount += (_data.servicePrice * (_data.item.length - countItem))
                            } else if (_data.unit === 'kg') {
                                let countItem = 0;
                                for (const _item of _data.item) {
                                    if (_item.itemStatus == "rejected") {
                                        countItem++;
                                    }
                                    _item.itemDetails.price = _data.servicePrice
                                }
                                totalAmount += (_data.servicePrice * Number(_data.unitValue))
                            } else if (_data?.unit?.toLowerCase() === 'item') {
                                for (const _item of _data.item) {
                                    if (_item.itemStatus !== "rejected") {
                                        totalAmount += _item.itemDetails.price
                                    }
                                }
                            }
                            customData[0]["totalSumAmount"] += totalAmount
                            customData[0]["billingDetails"].push({
                                _id: _data._id.serviceName,
                                totalAmount,
                                unit: _data.unit,
                                docCount: _data.item.length
                            })
                            for (const _item of _data.item) {
                                _item.isShowPrice = true
                            }
                            const obj = {
                                ..._data,
                                _id: _data._id.serviceName,
                                itemUnit: _data.unit,
                                items: _data.item
                            }
                            delete obj.item
                            delete obj.numberOfPacket
                            delete obj.unit
                            exceedQuota.push(obj)
                        }
                    }
                    customData[0]["exceedQouta"] = exceedQuota
                    customData[0]["confirmOrder"] = confirmOrder
                }
            } else {
                const exceedQuota = [];
                for (const _data of customData[0].confirmOrder) {
                    let totalAmount = 0
                    if (_data.unit === 'pcs') {
                        let countItem = 0;
                        for (const _item of _data.item) {
                            if (_item.itemStatus == "rejected") {
                                countItem++;
                            }
                            _item.itemDetails.price = _data.servicePrice
                        }
                        totalAmount += (_data.servicePrice * (_data.item.length - countItem))
                    } else if (_data.unit === 'kg') {
                        let countItem = 0;
                        for (const _item of _data.item) {
                            if (_item.itemStatus == "rejected") {
                                countItem++;
                            }
                            _item.itemDetails.price = _data.servicePrice
                        }
                        totalAmount += (_data.servicePrice * Number(_data.unitValue))
                    } else if (_data?.unit?.toLowerCase() === 'item') {
                        for (const _item of _data.item) {
                            if (_item.itemStatus !== "rejected") {
                                totalAmount += _item.itemDetails.price
                            }
                        }
                    }
                    customData[0]["totalSumAmount"] += totalAmount
                    customData[0]["billingDetails"].push({
                        _id: _data._id.serviceName,
                        totalAmount,
                        unit: _data.unit,
                        docCount: _data.item.length
                    })
                    for (const _item of _data.item) {
                        _item.isShowPrice = true
                    }
                    const obj = {
                        ..._data,
                        _id: _data._id.serviceName,
                        itemUnit: _data.unit,
                        items: _data.item
                    }
                    delete obj.item
                    delete obj.numberOfPacket
                    delete obj.unit
                    exceedQuota.push(obj)
                }
                customData[0]["confirmOrder"] = []
                customData[0]["exceedQouta"] = exceedQuota;
            }
            if (!packageDetails) {
                for (const element of customData[0]["confirmOrder"]) {
                    for (const item of element.item) {
                        if (item.itemStatus != "rejected") {
                            totalPrice += item.itemDetails.price
                            item.isShowPrice = true;
                        }
                    }
                }
            }
            if (customData[0]["deliveryCharges"] != "FREE" && customData[0]["deliveryCharges"] != null) {
                customData[0]["totalSumAmount"] += customData[0]["deliveryCharges"];
            }
            customData[0]["deliverdOrder"] = await DropOffImageSchema.findOne({ order_id: req.query.orderId });
            if (customData[0]["confirmOrder"] && customData[0]["confirmOrder"].length > 0) {
                customData[0]["totalItem"] = []
                for (const _order of customData[0]["confirmOrder"]) {
                    customData[0]["totalItem"].push({
                        _id: _order._id.serviceName,
                        itemCount: _order.unit.toLowerCase() == "kg" ? _order.unitValue : _order.item.length,
                        itemUnit: _order.unit
                    })
                }
            }
        }
        // else {
        //     const exceedQuota = [];
        //     for (const _data of customData[0].confirmOrder) {
        //         let totalAmount = 0
        //         if (_data.unit === 'pcs') {
        //             let countItem = 0;
        //             for (const _item of _data.item) {
        //                 if (_item.itemStatus == "rejected") {
        //                     countItem++;
        //                 }
        //                 _item.itemDetails.price = _data.servicePrice
        //             }
        //             totalAmount += (_data.servicePrice * (_data.item.length - countItem))
        //         } else if (_data.unit === 'kg') {
        //             let countItem = 0;
        //             for (const _item of _data.item) {
        //                 if (_item.itemStatus == "rejected") {
        //                     countItem++;
        //                 }
        //                 _item.itemDetails.price = _data.servicePrice
        //             }
        //             totalAmount += (_data.servicePrice * Number(_data.unitValue))
        //         } else if (_data?.unit?.toLowerCase() === 'item') {
        //             for (const _item of _data.item) {
        //                 if (_item.itemStatus !== "rejected") {
        //                     totalAmount += _item.itemDetails.price
        //                 }
        //             }
        //         }
        //         customData[0]["totalSumAmount"] += totalAmount
        //         customData[0]["billingDetails"].push({
        //             _id: _data._id.serviceName,
        //             totalAmount,
        //             unit: _data.unit,
        //             docCount: _data.item.length
        //         })
        //         for (const _item of _data.item) {
        //             _item.isShowPrice = true
        //         }
        //         const obj = {
        //             ..._data,
        //             _id: _data._id.serviceName,
        //             itemUnit: _data.unit,
        //             items: _data.item
        //         }
        //         delete obj.item
        //         delete obj.numberOfPacket
        //         delete obj.unit
        //         exceedQuota.push(obj)
        //     }
        //     customData[0]["confirmOrder"] = []
        //     customData[0]["exceedQouta"] = exceedQuota;
        //     console.log("plan expired");
        // }
        if (customData[0]["addonServices"].length > 0) {
            for (const element of customData[0]["addonServices"]) {
                if (element.addonServiceDetails.length > 0) {
                    element.offerDiscountPrice *= element.addonServiceDetails.find(v => v.serviceName_EN == element.addonService)?.quantity;
                    element.price *= element.addonServiceDetails.find(v => v.serviceName_EN == element.addonService)?.quantity;
                }
            }
        }
        if (customData[0]["addonServices"].length > 0) {
            for (const addonServices of customData[0]["addonServices"]) {
                customData[0]["totalSumAmount"] += addonServices.offerDiscountPrice;
            }
        }
        if (globalSetting.minimumOrderPrice > Number(customData[0].totalSumAmount) && !packageDetails) {
            customData[0]["total"] = customData[0]["totalSumAmount"];
        }

        // const remainingQuato = await RemainingServiceQuotaSchema.findOne({ buyPackageId: packageDetails?._id, userId: req.data }, { remainingServicesQuota: { $elemMatch: { quota: { $eq: 0 } } } });
        const remainingQuatoForCheck = await RemainingServiceQuotaSchema.findOne({ buyPackageId: packageDetails?._id, userId: req.data });
        customData[0]["totalSumAmount"] = (globalSetting.minimumOrderPrice > Number(customData[0].totalSumAmount) && !packageDetails) ? Number(globalSetting.minimumOrderPrice) : Number(customData[0].totalSumAmount);
        // customData[0]["quotaExpire"] = !remainingQuato ? true : remainingQuato?.remainingServicesQuota?.length >= 0 ? true : false;
        const isAllQuotaExhausted = remainingQuatoForCheck?.remainingServicesQuota?.every(q => q.quota <= 0) ?? true;
        customData[0]["quotaExpire"] = !remainingQuatoForCheck ? true : isAllQuotaExhausted;
        customData[0]["packageId"] = packageDetails;
        customData[0]['category'] = packageDetails?.packageCategory;
        if (packageDetails) {
            customData[0]['details'] = await checkSubscription(packageDetails);
        }
        console.log(customData, 'hgsdjhdakj')
        return res.json({
            data: customData
        })
    } catch (error) {
        console.log(error);
        return res.json({
            status: false,
            data: "An error occurred while processing the request"
        })
    }
});
/************************** End this api base of project *********************/
router.get("/get-remaining", async (req, res) => {
    try {
        const buyPackage = await BuyPackageSchema.findOne({ userId: req.data, subscriptionActive: true });
        let remainingQuato = [];
        if (buyPackage) {
            const packageHistory = await PackageHistorySchema.findOne({ packageId: buyPackage.packageId, userId: req.data, status: 1 }).sort({ buyDate: -1 });
            remainingQuato = await RemainingServiceQuotaSchema.findOne({ buyPackageId: buyPackage._id }).sort({ createdAt: -1 }).lean();
            let packageDetailsData = await subscriptionSchema.findOne({ _id: packageHistory.packageId });
            const orderCount = await placedOrderSchema.find({ userId: req.data, createdAt: { $gte: buyPackage.buyDate, $lte: new Date() } });
            if (packageDetailsData && orderCount.length < packageDetailsData[packageHistory.packageCategory + "_delivery"]) {
                remainingQuato["deliveryCharges"] = remainingQuato.deliveryQuota; //packageDetailsData[packageHistory.packageCategory + "_delivery"] - orderCount.length;
            } else {
                remainingQuato["deliveryCharges"] = "No free delivery";
            }
            remainingQuato["packageName"] = await subscriptionSchema.findOne({ _id: buyPackage.packageId }, { packageName_EN: 1, packageName_TH: 1 })
        }
        let response = {
            status: true,
            message: "",
            data: remainingQuato,
        };
        res.send(response);
    } catch (error) {
        res.send(error.message);
    }

});
/**
 * Get bulk Order QR
 **/
router.get('/get-bulk-order-qr', async (req, res) => {
    try {
        let userId = ObjectId(req.data)
        let placedOrders = await placedOrderSchema.find({
            pickup_driver: new ObjectId(userId), orderStatus: {
                $in: ["order_place", "picked_up", "inprocess(Examine clothes)",
                    "inprocess(payment success)", "inprocess(service process)", "delivery", "out_for_delivery"]
            }
        })
        let orderIds = placedOrders.map(order => new ObjectId(order._id))
        const priviousQRcodeId = await QRcodeSchema?.findOne({}, { QrId: 1 }).sort({ _id: -1 }).limit(1);
        const QrcodeId = priviousQRcodeId?.QrId == null ? 101 : Number(priviousQRcodeId?.QrId) + 1;
        let data = `${Buffer?.from(orderIds?.toString()).toString('base64')}`
        const QR = await QRCode?.toDataURL(data);
        let bulkQrData = await QRcodeSchema.findOne({ userId: new ObjectId(userId) })
        if (!bulkQrData) {
            const Data = new QRcodeSchema({
                QrId: QrcodeId,
                QrImage: QR,
                bulk_order_id: orderIds,
                userId: new ObjectId(req.data)
            });
            Data.save().then(async (qrDetail) => {
                let data = qrDetail._id
                const QR = await QRCode.toDataURL(data.toString());
                let EditedQR = await QRcodeSchema.findByIdAndUpdate(qrDetail._id, { QrImage: QR }, { new: true });
                if (EditedQR) {
                    let response = {
                        status: true,
                        message: "QR code genrated successfully",
                        data: EditedQR,
                    };
                    return res.send(response);
                } else {
                    let response = {
                        status: false,
                        message: "Oops something wrong please try latter",
                        data: {},
                    };
                    return res.send(response);
                }
            })
        }
        else {
            let response = {
                status: true,
                data: bulkQrData,
            };
            return res?.json(response)
        }
    } catch (err) {
        return res?.send(err.message);
    }
});
/**
 * Deliver Bulk Order
 */
router.get('/deliver_bulk-order', async (req, res) => {
    try {
        let { qrId } = req.query;
        let qrData = await QRcodeSchema.findOne({ _id: new ObjectId(qrId) });
        let orderId = qrData.order_id;
        let orderDetail = await placedOrderSchema.findOne({ orderId: orderId });
        if (orderDetail) {
            let getUserAddress = await AddressSchema.findOne({ _id: orderDetail?.addressId, isDelete: false })
            if (getUserAddress) {
                let driverArea = await UserSchema.findOne({ _id: req.data });
                if (getUserAddress.area_id.toString() != driverArea.areaName.toString()) {
                    let response = {
                        status: false,
                        message: "Order is not belong to this driver",
                        // data: vanDetails,
                    };
                    return res?.send(response);
                } else {
                    let order = await placedOrderSchema.updateOne(
                        { _id: orderDetail._id },
                        { $set: { orderStatus: 'out_for_delivery' } }
                    );
                    let response = {
                        status: true,
                        message: "Order is ready for delivery",
                        data: orderDetail,
                    };
                    return res?.send(response);
                }
            } else {
                let response = {
                    status: false,
                    message: "Order is not assigned to this driver",
                    // data: vanDetails,
                };
                return res?.send(response);
            }
        } else {
            let response = {
                status: true,
                message: "Order not found.",
                data: orderDetail,
            };
            return res?.send(response);
        }
        /**
         * Old Code 18Sep2024 
         */
        // let bulkQrData = await BulkOrderQRcodeSchema.findOne({ _id: new ObjectId(qrId) });
        // let orderIds = bulkQrData.bulk_order_id;
        // await placedOrderSchema.updateMany(
        //     { _id: { $in: orderIds } },
        //     { $set: { orderStatus: 'out_for_delivery' } }
        // );
        // let response = {
        //     status: true,
        //     message: "Orders delivered successfully",
        //     data: "",
        // };
        // res.send(response);
    } catch (err) {
        console.log(err);
        let response = {
            status: false,
            message: "An error occurred while processing the request",
            data: {},
        };
        res.status(500).send(response);
    }
});
/************ 15-06-2024 ************/
router.post("/create-customer", async (req, res) => {
    const { email } = req.body;
    console.log({ customer });
    return res.status(200).json({
        message: "",
        status: true
    })
});
/************ 15-06-2024 ************/
/**
 * Create Card api
 */
router.post("/create-card", async (req, res) => {
    try {
        const { name, cardNumber, cardExpiryYear, cardExpiryMonth, customerId, cardCVV } = req.body;
        const token = await omise.tokens.create({
            card: {
                name: name,
                number: cardNumber,
                expiration_month: cardExpiryMonth,
                expiration_year: cardExpiryYear,
                security_code: cardCVV,
            },
        });
        const customer = await getOrCreateOmiseCustomer(req.data);
        const customerCard = await omise.customers.update(
            customer.id,
            { card: token?.id },
        );
        return res.status(200).json({
            message: "Card added successfully",
            status: true
        })
    } catch (error) {
        console.log(error);
        return res.status(200).json({
            message: "Server error",
            status: false
        })
    }

});
/**
 * Update Card api
 */
router.post("/update-card", async (req, res) => {
    try {
        const { cardId, expiration_month, expiration_year } = req.body;
        const customer = await getOrCreateOmiseCustomer(req.data);
        const card = await omise.customers.updateCard(customer.id, cardId, {
            expiration_month: expiration_month,
            expiration_year: expiration_year,
        });
        return res.status(200).json({
            message: "Card updated successfully",
            status: true,
            data: card
        })
    } catch (error) {
        return res.status(500).json({
            message: "Server Error",
            status: false,
        })
    }

});
/**
 * Remove Card API
 */
router.post("/remove-card", async (req, res) => {
    try {
        const { cardId } = req.body;
        const customer = await getOrCreateOmiseCustomer(cardId);
        const card = omise.customers.destroyCard(
            customer.id,
            cardId
        );
        return res.status(200).json({
            message: "Card deleted successfully",
            status: true
        })
    } catch (error) {
        return res.status(500).json({
            message: "Server Error",
            status: false
        })
    }

});
/**
 * Card-list using customer Id
 * @param {*} customer Id 
 */
router.get("/card-list/:customerId", async (req, res) => {
    const { customerId } = req.params;
    if (!customerId) {
        return res.status(400).json({
            message: "Customer ID is required",
            status: false,
            data: [],
        });
    }

    try {
        const customer = await getOrCreateOmiseCustomer(req.data);
        const card = await omise.customers.retrieve(customer.id);

        return res.status(200).json({
            message: "Card list fetched successfully",
            status: true,
            data: card,
        });
    } catch (error) {
        console.error("Omise error in card-list:", error.message);
        return res.status(500).json({
            message: "Error occurred while fetching card list",
            status: false,
            data: [],
            error: error.message,
        });
    }
});

/**
 * Set Default Card
 */
router.post("/set-default-card", async (req, res) => {
    try {
        const { cardId } = req.body;
        const customer = await getOrCreateOmiseCustomer(req.data);
        const updatedCustomer = await omise.customers.update(customer.id, { default_card: cardId });
        return res.status(200).json({
            message: "Default card set successfully",
            status: true,
            data: updatedCustomer
        })
    } catch (error) {
        console.error("Error in set-default-card:", error.message);
        return res.status(500).json({
            message: "Servre Error",
            status: false,
        })
    }

});
/**
 * Create Payment by bank
 */
router.post("/create-payment-by-bank", async (req, res) => {
    try {
        const { bankId, platform, amount } = req.body;
        const banking = await omise.sources({
            "amount": Number(amount) * 100,
            "currency": "THB",
            "type": bankId,
            "platform_type": platform
        });
        res.json({
            status: true,
        })
    } catch (error) {

        res.json({
            status: false,
        })
    }

});
/**
 * Payment api
 */
router.get("/payment", async (req, res) => {
    try {
        const { type, amount } = req.query;
        var source = {
            type: type,
            amount: Number(amount) * 100,
            currency: "thb",
        };
        let sourceData = await omise.sources.create(source);
        return res.render("payment", { source: sourceData, data: req?.query });
    } catch (error) {
        console.log(error)
        return res.status(400).json({ status: false, message: error.message });
    }

});
/**
 * Checkout API using Mobile Banking
 */
router.post("/checkout", async (req, res) => {
    try {
        const { amount, currency, bankId } = req.body;
        const customer = await getOrCreateOmiseCustomer(req.data);
        const customerId = customer.id;
        if ((Number(amount) * 100) < 2000) {
            return res.json({
                status: false,
                message: "Amount must be greater than or equal to ฿20 (2000 satangs"
            })
        }
        var source = {
            type: bankId,
            amount: Number(amount) * 100,
            currency: currency,
        };
        let sourceData = await omise.sources.create(source);
        omise.charges.create({
            amount: Number(amount) * 100, // Amount in the smallest currency unit (e.g., cents for USD)
            currency: currency,
            source: sourceData.id,
            customer: customerId,
            description: 'Charge for card payment',
            return_uri: "https://cuelaundry.com",
        }, async (error, card) => {
            if (error) {
                console.log({ error });
                return res.status(400).json({ error: error.message });
            }
            const user = await userSchema.findOne({ omiseCustomerId: customerId, pushNotification: "1" });
            if (user && user.FCMToken) {
                let messageObj = {
                    title: "Cue Laundary",
                    body: `Payment sucessfully complated.`,
                    // types: `${data.orderId}`,
                };
                commonHelper?.pushNotificationSendCustomer(
                    user?.FCMToken,
                    messageObj
                );
            }
            return res.status(200).json({ url: card.authorize_uri, data: card, message: "Payment sucessfully complated", status: true });
        }
        );
    } catch (error) {
        console.log(error)
        return res.status(400).json({ status: false, message: error.message });
    }
});
/**
  * Trascation History api
 */
router.post("/trascation-history", async (req, res) => {
    try {
        const { chargeId, amount, type, userId, packageCategory, packageId, orderId, paymentType } = req.body
        const card = await omise.charges.retrieve(chargeId);
        if (card.status === "successful") {
            if (type == "package") {
                const Data = await TransactionSchema.create({
                    transactionId: card?.id,
                    paymentStatus: card?.status,
                    type: type,
                    amount: amount,
                    packageCategory: packageCategory,
                    userId: userId,
                    packageId: packageId,
                    paymentType: paymentType
                });
                // console.log({ Data });

                // const test = await commonHelper.quotaDeduction(Data);
                // console.log({ test });


            } else {
                const Data = await TransactionSchema.create({
                    transactionId: card?.id,
                    // customerId: card?.customer,
                    paymentStatus: card?.status,
                    type: type,
                    orderId: orderId,
                    userId: userId,
                    paymentType
                });
                const temp = {
                    paid: true,
                    paymentDate: new Date().getDate() > 8 ? new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setUTCHours(0, 0, 0, 0)) : new Date()
                };
                const updateStatus = await placedOrderSchema.findOneAndUpdate(
                    { userId: ObjectId(userId), _id: ObjectId(orderId) },
                    temp
                );
            }
        } else {
            if (type == "package") {
                const Data = await TransactionSchema.create({
                    transactionId: card?.id,
                    paymentStatus: card?.status,
                    type: type,
                    amount: amount,
                    packageCategory: packageCategory,
                    userId: userId,
                    packageId: packageId,
                    paymentType: paymentType
                });
                // const test = await commonHelper.quotaDeduction(Data);
            } else {
                const Data = await TransactionSchema.create({
                    transactionId: card?.id,
                    paymentStatus: card?.status,
                    type: type,
                    amount: amount,
                    packageCategory: packageCategory,
                    userId: userId,
                    paymentType,
                    packageId: packageId,
                });
            }
        }
        return res.status(200).json({ message: "Payment sucessfully complated", status: true });

    } catch (error) {
        console.log(error)
        return res.status(400).json({ status: false, message: error.message });
    }
});
/**
 * checkout card APi
 */
router.post("/checkout/card", async (req, res) => {
    try {
        const { amount, currency, cardId, type, userId, packageCategory, paymentType, packageId, orderId } = req.body;
        const customer = await getOrCreateOmiseCustomer(req.data || userId);
        const customerId = customer.id;
        if ((Number(amount) * 100) < 2000) {
            return res.json({
                status: false,
                message: "Amount must be greater than or equal to ฿20 (2000 satangs"
            })
        }
        omise.charges.create({
            amount: Number(amount) * 100, // Amount in the smallest currency unit (e.g., cents for USD)
            currency: currency,
            'customer': customerId,
            'card': cardId,
            description: 'Charge for card payment',
        }, async (error, card) => {
            if (error) {
                return res.status(400).json({ error: error.message });
            }
            if (card.status === "successful") {
                if (type == "package") {
                    const Data = await TransactionSchema.create({
                        transactionId: card?.transaction,
                        customerId: card?.customer,
                        paymentStatus: card?.status,
                        type: type,
                        amount: amount,
                        packageCategory: packageCategory,
                        userId: userId,
                        packageId: packageId,
                        paymentType
                    });
                    const user = await userSchema.findOne({ omiseCustomerId: customerId, pushNotification: "1" });
                    if (user && user.FCMToken) {
                        let messageObj = {
                            title: "Cue Laundary",
                            body: `Payment sucessfully complated.`,
                            // types: `${data.orderId}`,
                        };
                        commonHelper?.pushNotificationSendCustomer(
                            customer?.FCMToken,
                            messageObj
                        );
                    }
                } else {
                    const Data = await TransactionSchema.create({
                        transactionId: card?.transaction,
                        customerId: card?.customer,
                        paymentStatus: card?.status,
                        type: type,
                        orderId: orderId,
                        // packageCategory: req?.body?.packageCategory,
                        userId: userId,
                        paymentType
                        // packageId: req?.body?.packageId,
                    });
                    const temp = {
                        // orderStatus: "inprocess(payment success)",
                        paid: true
                    };
                    await placedOrderSchema.findOneAndUpdate({ userId: ObjectId(userId), _id: ObjectId(orderId) }, temp);
                    const user = await userSchema.findOne({ omiseCustomerId: customerId, pushNotification: "1" });
                    if (user && user.FCMToken) {
                        let messageObj = {
                            title: "Cue Laundary",
                            body: `Payment sucessfully complated.`,
                            // types: `${data.orderId}`,
                        };
                        commonHelper?.pushNotificationSendCustomer(
                            customer?.FCMToken,
                            messageObj
                        );
                    }
                }
            } else {
                const Data = await TransactionSchema.create({
                    transactionId: card?.transaction,
                    customerId: card?.customer,
                    paymentStatus: card?.status,
                    type: type,
                    amount: amount,
                    packageCategory: packageCategory,
                    userId: userId,
                    packageId: packageId,
                    paymentType
                });
                return res.status(200).json({ status: true, data: Data });
            }
            return res.status(200).json(card);
        });


    } catch (error) {
        console.log(error);
        return res.status(400).json({ message: card.error });
    }
});
// Payment  recurring apis
router.post("/schedule-payment", async (req, res) => {
    try {
        const { packageId, cardId, packageCategory } = req.body;
        const customer = await getOrCreateOmiseCustomer(req.data);
        const customerId = customer.id;
        const scheduleList = await omise.customers.schedules(customerId, { limit: 10000 });
        if (scheduleList && scheduleList.data.length > 0) {
            for (const schedule of scheduleList.data) {
                await omise.schedules.destroy(schedule.id);
            }
        }
        const packageDetails = await subscriptionSchema.aggregate([{ $match: { _id: ObjectId(packageId) } }, {
            $lookup: {
                from: "subscribeDuration",
                localField: "subcribeDuration",
                foreignField: "_id",
                as: "subcribeDuration"
            }
        }, {
            $unwind: {
                path: "$subcribeDuration",
                preserveNullAndEmptyArrays: true
            }
        }]);
        let date = new Date().toISOString();
        let newDate = date.split("T")[0];
        let endDate = new Date(new Date(newDate).setFullYear(new Date(newDate).getFullYear() + 3))
        let packagePrice = packageCategory == "S" ? packageDetails[0].S_price : packageCategory == "M" ? packageDetails[0].M_price : packageDetails[0].L_price;
        if ((Number(packagePrice) * 100) < 2000) {
            return res.json({
                status: false,
                message: "Amount must be greater than or equal to ฿20 (2000 satangs"
            })
        }
        const schedule = await omise.schedules.create({
            every: packageDetails[0]?.subcribeDuration?.duration ?? 1,
            period: 'month',
            start_date: newDate,
            end_date: endDate,
            on: {
                days_of_month: [new Date(newDate).getDate()],
            },
            charge: {
                customer: customerId,
                amount: Number(packagePrice) * 100,
                card: cardId,
                description: 'Membership fee',
            },
        });
        const Data = await TransactionSchema.create({
            transactionId: schedule?.id,
            customerId: customerId,
            paymentStatus: schedule?.status,
            type: "package",
            amount: packagePrice,
            packageCategory: packageCategory,
            userId: req.data,
            paymentType: req.paymentType,
            packageId: packageId,
        });
        return res.json({
            status: true,
            data: schedule
        })
    } catch (error) {
        console.log(error)
        return res.json({
            status: false,
            data: error,
            message: "Server Error"
        })
    }
});
// Delete recurring apis
router.post("/destroy-schedule", async (req, res) => {
    // const order = await placedOrderSchema.findOne({ userId: req.data, orderStatus: { $nin: ["deliverd", "cancel(customer)", "cancel(admin)"] } })
    // if (order) {
    //     return res.json({
    //         message: "You can not make any request till your order in process",
    //         status: false
    //     })
    // }
    try {
        const customer = await getOrCreateOmiseCustomer(req.data);
        const customerId = customer.id;
        const packageDetails = await BuyPackageSchema.deleteOne({ userId: req.data });
        const historyPack = await PackageHistorySchema.findOneAndUpdate({ userId: req.data, status: 1 }, { status: 0 })
        const scheduleList = await omise.customers.schedules(customerId, { limit: 10000 });
        for (const schedule of scheduleList.data) {
            await omise.schedules.destroy(schedule.id);
        }
        return res.json({
            data: scheduleList,
            message: "Package cancelled successfully",
            status: true
        })
    } catch (error) {
        return res.json({
            message: "Server Error",
            status: false
        })
    }

});
/**
 * Schedule Payment List
 */
router.get("/schedule-payment-list", async (req, res) => {
    try {
        const { limit = 100, skip = 0 } = req.query;

        const customer = await getOrCreateOmiseCustomer(req.data);

        const schedule = await omise.customers.schedules(customer.id, {
            limit: parseInt(limit),
            offset: parseInt(skip)
        });

        return res.json({
            status: true,
            data: schedule
        });

    } catch (err) {
        console.error("Error in /schedule-payment-list:", err);
        return res.status(500).json({
            status: false,
            message: "Failed to fetch schedule payment list",
            error: err.message || err
        });
    }
});

/**
 * Global Setting APi
 */
router.get("/global-setting", async (req, res) => {
    const setting = await globalSettingSchema.findOne({});
    return res.json({
        status: true,
        data: setting
    });
});
/**
 * Change Item Status
 */
router.post("/change-item-status", async (req, res) => {
    const { itemId, status } = req.body;
    const updated = await BagSchema.findOneAndUpdate({ "item._id": ObjectId(itemId) },
        { $set: { "item.$.itemStatus": status } },
        { returnDocument: "after" });
    return res.json({
        status: true,
        message: "Item status changed successfully",
        data: updated
    })
});
/**
 * SMS API Test     
 */
router.get("/test-otp", async (req, res) => {
    commonHelper.sendOTP({ message: "Test message By DEV", mobile: "+66922496352" });
    return res.json({
        status: true
    })
});
/**
 * Image upload and get url in response
 */
router.post("/image-upload", upload.single("image"), async (req, res) => {
    if (req.file) {
        const imageUrl = req.file.filename;
        return res.json({
            url: imageUrl,
            status: true
        })
    } else {
        return res.json({
            status: false,
            message: "Image not found."
        })
    }

});

router.delete("/account-delete", async (req, res) => {
    try {
        const user = await UserSchema.findOneAndUpdate({ _id: req.data }, { isDelete: true });
        return res.json({
            status: true,
            message: "Deleted account successfully"
        });

    } catch (error) {
        console.log(error);
        return res.json({
            status: false
        });
    }
});
router.get("/test", (req, res) => {
    commonHelper.quotaDeduction({
        "_id": "67a1b23e4c9c98e0435194bc",
        "userId": "67a1a90a4c9c98e04351920a",
        "packageId": "66d695be3533568eef543005",
        "offerDetails": "[]",
        "buyDate": "2025-02-04T09:13:57.000Z",
        "packageCategory": "S",
        "subscriptionActive": true,
        "createdAt": "2025-02-04T06:22:54.148Z",
        "updatedAt": "2025-02-04T09:13:57.835Z",
        "__v": 0
    }
    );
    return res.json({
        status: true
    })
});

async function checkSubscription(package) {
    try {
        let deliveryData = 0;
        const data = await BuyPackageSchema.find({ userId: package.userId });
        const historyData = await PackageHistorySchema.findOne({ packageId: data[0]?.packageId, userId: package.userId, status: 1 }).sort({ buyDate: -1 })
        if (historyData) {
            let packageDetailsData = await subscriptionSchema.findOne({ _id: historyData?.packageId });
            let remainQuota = await RemainingServiceQuotaSchema.findOne({ userId: package.userId });
            const orderCount = await placedOrderSchema.find({ userId: package.userId, createdAt: { $gte: data[0]?.buyDate, $lte: new Date() } });
            if (packageDetailsData && orderCount.length < packageDetailsData[historyData.packageCategory + "_delivery"]) {
                deliveryData = packageDetailsData[historyData.packageCategory + "_delivery"] - orderCount.length;
            } else {
                deliveryData = 0;
            }
            const remainingQuota = await RemainingServiceQuotaSchema.findOne({ userId: historyData.userId, buyPackageId: data[0]._id }).sort({ createdAt: -1 });
            const customer = await getOrCreateOmiseCustomer(package.userId);
            const schedule = await omise.customers.schedules(customer.id, { limit: 10000 });
            const checkAcitvePack = await TransactionSchema.findOne({
                userId: historyData.userId,
                packageId: {
                    $in: data.map(pkg => pkg.packageId)
                }
            }).sort({ createdAt: -1 });
            const currentPackage = await BuyPackageSchema.aggregate([
                {
                    $match: {
                        userId: historyData.userId,
                        packageCategory: { $in: data?.map((_data) => _data.packageCategory) },
                        subscriptionActive: true
                    },
                },
                {
                    $lookup: {
                        from: "subscriptions",
                        foreignField: "_id",
                        localField: "packageId",
                        as: "packageId",
                    },
                },
                {
                    $unwind: {
                        path: "$packageId",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: "subscribedurations",
                        localField: "packageId.subcribeDuration",
                        foreignField: "_id",
                        as: "packageId.subcribeDuration",
                    },
                },
                {
                    $lookup: {
                        from: "services",
                        localField: `packageId.services.${historyData.packageCategory.toLowerCase()}.serviceId`,
                        foreignField: "_id",
                        as: "packageId.services",
                    },
                },
                {
                    $lookup: {
                        from: "items",
                        localField: "packageId.services.item",
                        foreignField: "_id",
                        as: "packageId.item",
                    },
                },
            ]);
            const packageArr = [];
            for (const pack of currentPackage) {
                const obj = {
                    package_Id: "",
                    packageName_EN: "",
                    packageName_TH: "",
                    buyDate: "",
                    subcribeDuration: [],
                    item: [],
                    services: [],
                    description_EN: "",
                    description_TH: "",
                    buyPack: [],
                };
                obj.package_Id += pack?.packageId?._id;
                obj.packageName_EN += pack?.packageId?.packageName_EN;
                obj.packageName_TH += pack?.packageId?.packageName_TH;
                obj.description_EN += pack?.packageId?.description_EN;
                obj.description_TH += pack?.packageId?.description_TH;
                obj.buyDate += pack.buyDate;
                obj.subcribeDuration.push(...pack?.packageId?.subcribeDuration);
                obj.services.push(...pack?.packageId?.services);
                obj.item.push(...pack?.packageId?.item);
                const pack_category = [];
                if (data.find((x) => x?.packageCategory.toUpperCase() == "S")) {
                    // console.log("small pack k array m data put krna h")
                    if (pack?.packageId.S_package_size == data.find((x) => x?.packageCategory.toUpperCase() == "S")?.packageCategory) {
                        const smallPackObj = {};
                        smallPackObj.size = pack?.packageId.S_package_size;
                        smallPackObj.price = pack?.packageId?.S_price;
                        smallPackObj.quantity = pack?.packageId?.S_quantity;
                        smallPackObj.delivery = remainQuota.deliveryQuota;
                        smallPackObj.packDescriptionEN = pack?.packageId?.small_pack_description_EN;
                        smallPackObj.packDescriptionTH = pack?.packageId?.small_pack_description_TH;
                        // smallPackObj.status = checkAcitvePack.paymentType != "card" ? true : schedule.data.find((val) => val.status != "deleted") ? true : false
                        smallPackObj.status = data ? true : false
                        smallPackObj.expireQuota = remainingQuota.remainingServicesQuota.every((val) => val.quota == 0);
                        smallPackObj.Quota = remainingQuota.remainingServicesQuota;
                        pack_category?.push(smallPackObj);
                    }
                }
                if (data.find((x) => x?.packageCategory.toUpperCase() == "M")) {
                    if (pack?.packageId.M_package_size == data.find((x) => x?.packageCategory.toUpperCase() == "M")?.packageCategory) {
                        const mediumPackObj = {};
                        mediumPackObj.size = pack?.packageId.M_package_size;
                        mediumPackObj.price = pack?.packageId?.M_price;
                        mediumPackObj.quantity = pack?.packageId?.M_quantity;
                        mediumPackObj.delivery = remainQuota.deliveryQuota;
                        mediumPackObj.packDescriptionEN = pack?.packageId?.medium_pack_description_EN;
                        mediumPackObj.packDescriptionTH = pack?.packageId?.medium_pack_description_TH;
                        // mediumPackObj.status = checkAcitvePack.paymentType != "card" ? true : schedule.data.find((val) => val.status != "deleted") ? true : false
                        mediumPackObj.status = data ? true : false
                        mediumPackObj.expireQuota = remainingQuota.remainingServicesQuota.every((val) => val.quota == 0);
                        mediumPackObj.Quota = remainingQuota.remainingServicesQuota;
                        pack_category?.push(mediumPackObj);
                    }
                }
                if (data.find((x) => x?.packageCategory.toUpperCase() == "L")) {
                    if (pack?.packageId.L_package_size == data.find((x) => x?.packageCategory.toUpperCase() == "L")?.packageCategory) {
                        const largePackObj = {};
                        largePackObj.size = pack?.packageId.L_package_size;
                        largePackObj.price = pack?.packageId?.L_price;
                        largePackObj.quantity = pack?.packageId?.L_quantity;
                        largePackObj.delivery = remainQuota.deliveryQuota;
                        largePackObj.packDescriptionEN = pack?.packageId?.large_pack_description_EN;
                        largePackObj.packDescriptionTH = pack?.packageId?.large_pack_description_TH;
                        largePackObj.status = data ? true : false;
                        // largePackObj.status = checkAcitvePack.paymentType != "card" ? true : schedule.data.find((val) => val.status != "deleted") ? true : false
                        largePackObj.expireQuota = remainingQuota.remainingServicesQuota.every((val) => val.quota == 0);
                        largePackObj.Quota = remainingQuota.remainingServicesQuota;
                        pack_category?.push(largePackObj);
                    }
                }
                obj.buyPack = pack_category;
                packageArr?.push(obj);
            }
            return packageArr;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }

}
module.exports = router;