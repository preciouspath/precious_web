import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import { STATUS_CODE } from "../../utils/statusCode";
import User from "../../models/user";
import { CONSTANTS } from "../../utils/constant";
import { BusinessOwner, KYCStatus } from "../../models/Business";
import { Campaign } from "../../models/Campaign";
import Ticket from "../../models/Ticket";


export const getDashboardTiles = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const [
      totalPatients,
      activePatients,
      totalBusiness,
      pendingBusinessKYC,
      totalAds,
      openTickets,
    ] = await Promise.all([
      User.countDocuments({ role: CONSTANTS.ROLE.PATIENT }),
      User.countDocuments({
        role: CONSTANTS.ROLE.PATIENT,
        status: "active",
      }),
      BusinessOwner.countDocuments(),
      BusinessOwner.countDocuments({ kycStatus: KYCStatus.PENDING }),
      Campaign.countDocuments(),
      Ticket.countDocuments({ status: "open" }),
    ]);

    return res.status(STATUS_CODE.OK).json({
      message: "Dashboard tiles fetched successfully",
      data: {
        totalPatients,
        activePatients,
        totalBusiness,
        pendingBusinessKYC,
        totalAds,
        openTickets,
      },
    });

  }
);


export const getPatientBusinessGraph = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const year = Number(req.query.year) || new Date().getFullYear();

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const patientAggregation = await User.aggregate([
      {
        $match: {
          role: CONSTANTS.ROLE.PATIENT,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);

    const businessAggregation = await BusinessOwner.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]);

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    let cumulativePatients = 0;
    let cumulativeBusiness = 0;

    const graphData = months.map((month, index) => {
      const patientMonth = patientAggregation.find(
        (p) => p._id.month === index + 1
      );
      const businessMonth = businessAggregation.find(
        (b) => b._id.month === index + 1
      );

      cumulativePatients += patientMonth?.count || 0;
      cumulativeBusiness += businessMonth?.count || 0;

      return {
        month,
        patients: cumulativePatients,
        business: cumulativeBusiness,
      };
    });

    return res.status(STATUS_CODE.OK).json({
      message: "Dashboard graph data fetched successfully",
      data: graphData,
    });
  }
);
