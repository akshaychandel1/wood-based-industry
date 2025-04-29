const express = require("express");
const router = express.Router();
const { poolPromise } = require("../config/db"); // ✅ Ensure connection pool is used


// This endpoint might already exist; ensure it matches this logic if used directly by BarChartTotalUnits
router.get("/total-units", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        COALESCE(d.longname, 'Unknown District') AS district,
        COUNT(*) AS total_units
      FROM (
        SELECT Id, unitLocationaddrdist AS district_id, wbicategoryid FROM WBIPB.dbo.wbi_unitreg
        UNION ALL
        SELECT Id, UnitAddrDistrict AS district_id, wbicategoryid FROM WBIPB.dbo.wbi_existingunit
        UNION ALL
        SELECT Id, UnitAddrDistrict AS district_id, wbicategoryid FROM WBIPB.dbo.wbi_UnitOwnershipChange
        UNION ALL
        SELECT Id, UnitAddrDistrict AS district_id, wbicategoryid FROM WBIPB.dbo.wbi_RelocationUnit
      ) u
      LEFT JOIN WBIPB.dbo.wbi_districts d ON u.district_id = d.id
      GROUP BY d.longname
      ORDER BY total_units DESC;
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error in /dashboard/total-units:", err.message);
    res.status(500).json({ error: "Error fetching total units data" });
  }
});

// 📊 Category-wise units for a district
router.get("/district-category", async (req, res) => {
  const { district } = req.query;
  if (!district) return res.status(400).json({ error: "District is required" });

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("district", district)
      .query(`
        SELECT 
          COALESCE(c.longname, 'Unknown Category') AS name,
          COUNT(*) AS value
        FROM (
          SELECT wbicategoryid, unitLocationaddrdist AS district_id 
          FROM WBIPB.dbo.wbi_unitreg
          UNION ALL
          SELECT wbicategoryid, UnitAddrDistrict AS district_id 
          FROM WBIPB.dbo.wbi_existingunit
          UNION ALL
          SELECT wbicategoryid, UnitAddrDistrict AS district_id 
          FROM WBIPB.dbo.wbi_UnitOwnershipChange
          UNION ALL
          SELECT wbicategoryid, UnitAddrDistrict AS district_id 
          FROM WBIPB.dbo.wbi_RelocationUnit
        ) u
        LEFT JOIN WBIPB.dbo.wbi_districts d ON u.district_id = d.id
        LEFT JOIN WBIPB.dbo.wbi_woodindcategory c ON u.wbicategoryid = c.id
        WHERE d.longname = @district
        GROUP BY c.longname
        ORDER BY value DESC;
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error in /dashboard/district-category:", err.message);
    res.status(500).json({ error: "Error fetching category data" });
  }
});

// 📊 Detailed data for a category in a district
router.get("/district-category-details", async (req, res) => {
  const { district, category } = req.query;
  if (!district || !category) return res.status(400).json({ error: "District and category are required" });

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("district", district)
      .input("category", category)
      .query(`
        SELECT 
          u.Id AS id,
          u.firmname,
          u.ownername,
          COALESCE(d.longname, 'Unknown District') AS location
        FROM (
          SELECT Id, firmname, Ownername AS ownername, unitLocationaddrdist AS district_id, wbicategoryid
          FROM WBIPB.dbo.wbi_unitreg
          UNION ALL
          SELECT Id, firmname, Ownername AS ownername, UnitAddrDistrict AS district_id, wbicategoryid
          FROM WBIPB.dbo.wbi_existingunit
          UNION ALL
          SELECT Id, firmname, NULL AS ownername, UnitAddrDistrict AS district_id, wbicategoryid
          FROM WBIPB.dbo.wbi_UnitOwnershipChange
          UNION ALL
          SELECT Id, firmname, NULL AS ownername, UnitAddrDistrict AS district_id, wbicategoryid
          FROM WBIPB.dbo.wbi_RelocationUnit
        ) u
        LEFT JOIN WBIPB.dbo.wbi_districts d ON u.district_id = d.id
        LEFT JOIN WBIPB.dbo.wbi_woodindcategory c ON u.wbicategoryid = c.id
        WHERE d.longname = @district AND c.longname = @category;
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error in /dashboard/district-category-details:", err.message);
    res.status(500).json({ error: "Error fetching category details" });
  }
});

// 📊 Distribution of unit categories with district names
router.get("/unit-categories", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        COALESCE(c.longname, 'Unknown Category') AS category,
        COUNT(u.Id) AS total_units,
        JSON_QUERY(( 
          SELECT 
            u.Ownername,
            u.Gender,
            u.Ownerphoto,
            u.Mobile,
            u.firmname,
            CONCAT(
              COALESCE(u.UnitAddrLine1, ''), 
              CASE WHEN u.UnitAddrLine2 IS NOT NULL THEN ', ' + u.UnitAddrLine2 ELSE '' END,
              CASE WHEN u.UnitAddrLine3 IS NOT NULL THEN ', ' + u.UnitAddrLine3 ELSE '' END,
              CASE WHEN u.UnitAddrVTC IS NOT NULL THEN ', ' + u.UnitAddrVTC ELSE '' END,
              CASE WHEN u.UnitAddrPincode IS NOT NULL THEN ' - ' + u.UnitAddrPincode ELSE '' END
            ) AS full_address,
            d.longname AS district_name,
            u.Timbervolume,
            COALESCE(
              (SELECT STRING_AGG(s.speciesname, ', ') 
               FROM STRING_SPLIT(u.Species, ',') ss
               LEFT JOIN WBIPB.dbo.wbi_species s ON TRY_CAST(TRIM(ss.value) AS INT) = s.id),
              'Unknown'
            ) AS Species, /* Split Species IDs and join with wbi_species */
            COALESCE(c.longname, 'Unknown') AS Category
          FROM WBIPB.dbo.wbi_unitreg u
          LEFT JOIN WBIPB.dbo.wbi_districts d ON u.unitLocationaddrdist = d.id
          WHERE u.wbicategoryid = c.id
          FOR JSON PATH
        )) AS unit_details
      FROM WBIPB.dbo.wbi_woodindcategory c
      LEFT JOIN WBIPB.dbo.wbi_unitreg u ON u.wbicategoryid = c.id
      GROUP BY c.longname, c.id
      ORDER BY total_units DESC;
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error in /unit-categories:", err.stack);
    res.status(500).json({ error: "Error fetching unit categories data" });
  }
});


router.get("/license-status", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      WITH LicenseData AS (
        SELECT 
          Id,
          LicenseNo,
          LicenseRenewalFrom,
          LicenseRenewalTo,
          LicenseIssueDate,
          DFODivision,
          UploadLicense,
          LetterNo,
          LetterDate,
          IsRecommendRFO,
          IsRecommendSDFO,
          RecommendRFORemarks,
          RecommendSDFORemarks,
          RFOEnquiryPdf,
          SubDivEnquiryPdf,
          IsActive,
          CreatedDate,
          ModifiedDate,
          CASE 
            WHEN LicenseRenewalTo < GETDATE() THEN 'Expired' 
            ELSE 'Active' 
          END AS license_status
        FROM WBIPB.dbo.wbi_existingunitdfo
      )
      SELECT 
        -- Summary data
        (SELECT 
          license_status,
          COUNT(*) AS total
        FROM LicenseData
        GROUP BY license_status
        FOR JSON PATH) AS summary_json,
        -- Detailed license data
        (SELECT *
        FROM LicenseData
        FOR JSON PATH) AS licenses_json
    `);

    // Parse the JSON strings returned by SQL Server
    const summary = JSON.parse(result.recordset[0].summary_json || '[]');
    const licenses = JSON.parse(result.recordset[0].licenses_json || '[]');

    // Combine into a single response object
    const response = {
      summary,
      licenses
    };

    res.json(response);
  } catch (err) {
    console.error("❌ Error in /license-status:", err.message);
    res.status(500).json({ error: "Error fetching license status data" });
  }
});

// 📊 Licenses issued by year
router.get("/licenses-by-year", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT YEAR(Createddate) AS year, COUNT(Id) AS total
      FROM WBIPB.dbo.wbi_unitreg
      GROUP BY YEAR(Createddate)
      ORDER BY year
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error in /licenses-by-year:", err.message);
    res.status(500).json({ error: "Error fetching licenses by year data" });
  }
});


router.get("/ownership-changes", async (req, res) => {
  try {
    const pool = await poolPromise;
    const { district, licenseNo, id, detailed = "false", year } = req.query;

    if (detailed === "true" || district || licenseNo || id || year) {
      let query = `
        SELECT 
          uoc.Id,
          uoc.Licenseno,
          uoc.Licensedate,
          uoc.Licenseexp,
          uoc.UnitAddrDistrict AS districtId,
          d.longname AS districtName,
          uoc.wbicategoryid AS categoryId,
          wc.longname AS categoryName,
          uoc.HorsePower,
          uoc.GST,
          uoc.UnitLocationaddrlat AS latitude,
          uoc.Unitlocationaddrlong AS longitude,
          uoc.UnitAddrLine1,
          uoc.UnitAddrLine2,
          uoc.UnitAddrLine3,
          uoc.UnitAddrVTC,
          uoc.UnitAddrPincode,
          uoc.UnitAddrDistrict,
          uoc.KhasraNo,
          uoc.firmname,
          uoc.Applicant_Authorize_Type,
          uoc.IncomeStatus,
          uoc.YearlyIncome,
          uoc.Createddate,
          uoc.Modifieddate,
          uoc.Isactive,
          uoc.IsUnitRunning,
          CASE 
            WHEN EXISTS (
              SELECT 1 
              FROM WBIPB.dbo.wbi_UOCDFO df 
              WHERE df.wbiid = uoc.Id
            ) THEN 1 
            ELSE 0 
          END AS IsApproved
        FROM WBIPB.dbo.wbi_UnitOwnershipchange uoc
        LEFT JOIN WBIPB.dbo.wbi_districts d ON uoc.UnitAddrDistrict = d.id
        LEFT JOIN WBIPB.dbo.wbi_woodindcategory wc ON uoc.wbicategoryid = wc.id
        WHERE 1=1
      `;
      const params = {};
      if (district) {
        query += " AND uoc.UnitAddrDistrict = @district";
        params.district = district;
      }
      if (licenseNo) {
        query += " AND uoc.Licenseno = @licenseNo";
        params.licenseNo = licenseNo;
      }
      if (id) {
        query += " AND uoc.Id = @id";
        params.id = id;
      }
      if (year) {
        query += " AND YEAR(uoc.Createddate) = @year";
        params.year = year;
      }
      query += " ORDER BY uoc.Createddate DESC";

      const request = pool.request();
      for (const [key, value] of Object.entries(params)) {
        request.input(key, value);
      }
      const result = await request.query(query);
      return res.json(result.recordset);
    }

    const query = `
      SELECT 
        uoc.UnitAddrDistrict AS districtId,
        d.longname AS districtName,
        YEAR(uoc.Createddate) AS year,
        COUNT(uoc.Id) AS total_changes
      FROM WBIPB.dbo.wbi_UnitOwnershipchange uoc
      LEFT JOIN WBIPB.dbo.wbi_districts d ON uoc.UnitAddrDistrict = d.id
      WHERE uoc.UnitAddrDistrict IS NOT NULL
      GROUP BY uoc.UnitAddrDistrict, d.longname, YEAR(uoc.Createddate)
      ORDER BY year, districtName
    `;
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error in /ownership-changes:", err.message);
    res.status(500).json({ error: "Error fetching ownership changes data" });
  }
});


// router.get("/ownership-changes", async (req, res) => {
//   try {
//     const pool = await poolPromise;
//     const { district, licenseNo, id, detailed = "false", year } = req.query;

//     if (detailed === "true" || district || licenseNo || id || year) {
//       let query = `
//         SELECT 
//           uoc.Id,
//           uoc.Licenseno,
//           uoc.Licensedate,
//           uoc.Licenseexp,
//           uoc.UnitAddrDistrict AS districtId,
//           d.longname AS districtName,
//           uoc.wbicategoryid AS categoryId,
//           wc.longname AS categoryName,
//           uoc.HorsePower,
//           uoc.GST,
//           uoc.UnitLocationaddrlat AS latitude,
//           uoc.Unitlocationaddrlong AS longitude,
//           uoc.UnitAddrLine1,
//           uoc.UnitAddrLine2,
//           uoc.UnitAddrLine3,
//           uoc.UnitAddrVTC,
//           uoc.UnitAddrPincode,
//           uoc.UnitAddrDistrict,
//           uoc.KhasraNo,
//           uoc.firmname,
//           uoc.Applicant_Authorize_Type,
//           uoc.IncomeStatus,
//           uoc.YearlyIncome,
//           uoc.Createddate,
//           uoc.Modifieddate,
//           uoc.Isactive,
//           uoc.IsUnitRunning
//         FROM WBIPB.dbo.wbi_UnitOwnershipChange uoc
//         LEFT JOIN WBIPB.dbo.wbi_districts d ON uoc.UnitAddrDistrict = d.id
//         LEFT JOIN WBIPB.dbo.wbi_woodindcategory wc ON uoc.wbicategoryid = wc.id
//         WHERE 1=1
//       `;
//       const params = {};
//       if (district) {
//         query += " AND uoc.UnitAddrDistrict = @district";
//         params.district = district;
//       }
//       if (licenseNo) {
//         query += " AND uoc.Licenseno = @licenseNo";
//         params.licenseNo = licenseNo;
//       }
//       if (id) {
//         query += " AND uoc.Id = @id";
//         params.id = id;
//       }
//       if (year) {
//         query += " AND YEAR(uoc.Createddate) = @year";
//         params.year = year;
//       }
//       query += " ORDER BY uoc.Createddate DESC";

//       const request = pool.request();
//       for (const [key, value] of Object.entries(params)) {
//         request.input(key, value);
//       }
//       const result = await request.query(query);
//       return res.json(result.recordset);
//     }

//     const query = `
//       SELECT 
//         uoc.UnitAddrDistrict AS districtId,
//         d.longname AS districtName,
//         YEAR(uoc.Createddate) AS year,
//         COUNT(uoc.Id) AS total_changes
//       FROM WBIPB.dbo.wbi_UnitOwnershipChange uoc
//       LEFT JOIN WBIPB.dbo.wbi_districts d ON uoc.UnitAddrDistrict = d.id
//       WHERE uoc.UnitAddrDistrict IS NOT NULL
//       GROUP BY uoc.UnitAddrDistrict, d.longname, YEAR(uoc.Createddate)
//       ORDER BY year, districtName
//     `;
//     const result = await pool.request().query(query);
//     res.json(result.recordset);
//   } catch (err) {
//     console.error("❌ Error in /ownership-changes:", err.message);
//     res.status(500).json({ error: "Error fetching ownership changes data" });
//   }
// });

// 📊 Units transferred vs. non-transferred
router.get("/transferred-units", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        CASE 
          WHEN Istransfered IS NULL THEN 'Not Transferred' 
          ELSE 'Transferred' 
        END AS transfer_status,
        COUNT(Id) AS total
      FROM WBIPB.dbo.wbi_UnitOwnershipchange
      GROUP BY 
        CASE 
          WHEN Istransfered IS NULL THEN 'Not Transferred' 
          ELSE 'Transferred' 
        END
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error in /transferred-units:", err.message);
    res.status(500).json({ error: "Error fetching transferred units data" });
  }
});

// 📊 Units in Eco-Sensitive Zones
router.get("/eco-sensitive-units", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT IsWithinEcosensitiveZone AS eco_zone, COUNT(Id) AS total_units
      FROM WBIPB.dbo.wbi_RelocationUnit
      GROUP BY IsWithinEcosensitiveZone
    `);
    res.json(result.recordset.map((item) => ({ ...item, intensity: item.total_units / 100 })));
  } catch (err) {
    console.error("❌ Error in /eco-sensitive-units:", err.message);
    res.status(500).json({ error: "Error fetching eco-sensitive units data" });
  }

});

// 📊 Aggregate data for graph
router.get("/new-applications/aggregate", async (req, res) => {
  try {
    const pool = await poolPromise;
    const { type, district, category } = req.query;

    const validTypes = ["New License", "Renewal", "Ownership Change", "Relocation"];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid type parameter" });
    }

    let query = `
      SELECT 
        FORMAT(date, 'yyyy-MM') AS month,
        type,
        COUNT(*) AS total
      FROM (
    `;

    const typeQueries = [];
    if (!type || type === "New License") {
      typeQueries.push(`
        SELECT Createddate AS date, 'New License' AS type, unitLocationaddrdist, wbicategoryid
        FROM WBIPB.dbo.wbi_unitreg
        WHERE Createddate IS NOT NULL
      `);
    }
    if (!type || type === "Renewal") {
      typeQueries.push(`
        SELECT Createddate AS date, 'Renewal' AS type, UnitAddrDistrict, wbicategoryid
        FROM WBIPB.dbo.wbi_existingunit
        WHERE Createddate IS NOT NULL
      `);
    }
    if (!type || type === "Ownership Change") {
      typeQueries.push(`
        SELECT Createddate AS date, 'Ownership Change' AS type, UnitAddrDistrict, wbicategoryid
        FROM WBIPB.dbo.wbi_UnitOwnershipChange
        WHERE Createddate IS NOT NULL
      `);
    }
    if (!type || type === "Relocation") {
      typeQueries.push(`
        SELECT Createddate AS date, 'Relocation' AS type, UnitAddrDistrict, wbicategoryid
        FROM WBIPB.dbo.wbi_RelocationUnit
        WHERE Createddate IS NOT NULL
      `);
    }

    if (typeQueries.length === 0) {
      return res.status(400).json({ error: "No valid type specified" });
    }

    query += typeQueries.join(" UNION ALL ") + `
      ) AS combined
      WHERE 1=1
    `;

    const params = {};
    if (district) {
      if (type === "New License" || !type) {
        query += " AND unitLocationaddrdist = @district";
      } else {
        query += " AND UnitAddrDistrict = @district";
      }
      params.district = district;  // Always set this if district is provided
    }
    
    if (category) {
      query += " AND wbicategoryid = @category";
      params.category = category;
    }

    query += `
      GROUP BY FORMAT(date, 'yyyy-MM'), type
      ORDER BY month, type
    `;

    const request = pool.request();
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }

    const result = await request.query(query);
    res.json(result.recordset.map(row => ({
      month: row.month,
      type: row.type,
      total: row.total
    })));
  } catch (err) {
    console.error("❌ Error in /new-applications/aggregate:", err.stack);
    res.status(500).json({ error: "Error fetching aggregate data" });
  }
});

// 📋 Detailed data for dialog
router.get("/new-applications/details", async (req, res) => {
  try {
    const pool = await poolPromise;
    const { month } = req.query;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: "Month parameter must be in 'yyyy-MM' format" });
    }

    console.log(`Fetching details for month: ${month}`);

    let query = `
      SELECT 
        'New License' AS type, 
        ur.Id, 
        ur.firmname, 
        ur.LicenseRegistrationCertificatenumber AS LicenseNo, 
        ur.Createddate AS createdDate,
        d.longname AS districtName, 
        wc.longname AS categoryName, 
        NULL AS DFO_Division, 
        NULL AS LicenseRenewalFrom, 
        NULL AS LicenseRenewalTo
      FROM WBIPB.dbo.wbi_unitreg ur
      LEFT JOIN WBIPB.dbo.wbi_districts d ON ur.unitLocationaddrdist = d.id
      LEFT JOIN WBIPB.dbo.wbi_woodindcategory wc ON ur.wbicategoryid = wc.id
      WHERE FORMAT(ur.Createddate, 'yyyy-MM') = @month
      UNION ALL
      SELECT 
        'Renewal' AS type, 
        eu.Id, 
        eu.firmname, 
        eu.Licenseno AS LicenseNo, 
        eu.Createddate AS createdDate,
        d.longname AS districtName, 
        wc.longname AS categoryName, 
        eud.DFODivision AS DFO_Division, 
        eud.LicenseRenewalFrom, 
        eud.LicenseRenewalTo
      FROM WBIPB.dbo.wbi_existingunit eu
      LEFT JOIN WBIPB.dbo.wbi_existingUnitDFO eud ON eu.Id = eud.wbiid AND eud.IsActive = 1
      LEFT JOIN WBIPB.dbo.wbi_districts d ON eu.UnitAddrDistrict = d.id
      LEFT JOIN WBIPB.dbo.wbi_woodindcategory wc ON eu.wbicategoryid = wc.id
      WHERE FORMAT(eu.Createddate, 'yyyy-MM') = @month
      UNION ALL
      SELECT 
        'Ownership Change' AS type, 
        uoc.Id, 
        uoc.firmname, 
        uoc.Licenseno AS LicenseNo, 
        uoc.Createddate AS createdDate,
        d.longname AS districtName, 
        wc.longname AS categoryName, 
        uocd.DFODivision AS DFO_Division, 
        uocd.LicenseRenewalFrom, 
        uocd.LicenseRenewalTo
      FROM WBIPB.dbo.wbi_UnitOwnershipChange uoc
      LEFT JOIN WBIPB.dbo.wbi_UOCDFO uocd ON uoc.Id = uocd.wbiid AND uocd.IsActive = 1
      LEFT JOIN WBIPB.dbo.wbi_districts d ON uoc.UnitAddrDistrict = d.id
      LEFT JOIN WBIPB.dbo.wbi_woodindcategory wc ON uoc.wbicategoryid = wc.id
      WHERE FORMAT(uoc.Createddate, 'yyyy-MM') = @month
      UNION ALL
      SELECT 
        'Relocation' AS type, 
        ru.Id, 
        ru.firmname, 
        ru.Licenseno AS LicenseNo, 
        ru.Createddate AS createdDate,
        d.longname AS districtName, 
        wc.longname AS categoryName, 
        NULL AS DFO_Division, 
        NULL AS LicenseRenewalFrom, 
        NULL AS LicenseRenewalTo
      FROM WBIPB.dbo.wbi_RelocationUnit ru
      LEFT JOIN WBIPB.dbo.wbi_districts d ON ru.UnitAddrDistrict = d.id
      LEFT JOIN WBIPB.dbo.wbi_woodindcategory wc ON ru.wbicategoryid = wc.id
      WHERE FORMAT(ru.Createddate, 'yyyy-MM') = @month
      ORDER BY createdDate DESC
    `;

    const request = pool.request().input("month", month);
    const result = await request.query(query);

    console.log(`Fetched ${result.recordset.length} records for month: ${month}`);

    res.json(result.recordset.map(row => ({
      type: row.type,
      id: row.Id,
      firmName: row.firmname || "N/A",
      licenseNo: row.LicenseNo || "N/A",
      createdDate: row.createdDate,
      districtName: row.districtName || "Unknown",
      categoryName: row.categoryName || "Unknown",
      dfoDivision: row.DFO_Division || "N/A",
      renewalFrom: row.LicenseRenewalFrom || null,
      renewalTo: row.LicenseRenewalTo || null
    })));
  } catch (err) {
    console.error("❌ Error in /new-applications/details:", err.stack);
    res.status(500).json({ error: "Error fetching detailed data" });
  }
});

// 🌐 Filter options (only districts and categories with data)
router.get("/new-applications/filters", async (req, res) => {
  try {
    const pool = await poolPromise;

    const districtQuery = `
      SELECT DISTINCT d.id, d.longname AS name
      FROM WBIPB.dbo.wbi_districts d
      WHERE EXISTS (
        SELECT 1 FROM WBIPB.dbo.wbi_unitreg ur WHERE ur.unitLocationaddrdist = d.id
        UNION ALL
        SELECT 1 FROM WBIPB.dbo.wbi_existingunit eu WHERE eu.UnitAddrDistrict = d.id
        UNION ALL
        SELECT 1 FROM WBIPB.dbo.wbi_UnitOwnershipChange uoc WHERE uoc.UnitAddrDistrict = d.id
        UNION ALL
        SELECT 1 FROM WBIPB.dbo.wbi_RelocationUnit ru WHERE ru.UnitAddrDistrict = d.id
      )
      ORDER BY d.longname
    `;

    const categoryQuery = `
      SELECT DISTINCT wc.id, wc.longname AS name
      FROM WBIPB.dbo.wbi_woodindcategory wc
      WHERE EXISTS (
        SELECT 1 FROM WBIPB.dbo.wbi_unitreg ur WHERE ur.wbicategoryid = wc.id
        UNION ALL
        SELECT 1 FROM WBIPB.dbo.wbi_existingunit eu WHERE eu.wbicategoryid = wc.id
        UNION ALL
        SELECT 1 FROM WBIPB.dbo.wbi_UnitOwnershipChange uoc WHERE uoc.wbicategoryid = wc.id
        UNION ALL
        SELECT 1 FROM WBIPB.dbo.wbi_RelocationUnit ru WHERE ru.wbicategoryid = wc.id
      )
      ORDER BY wc.longname
    `;

    const [districtResult, categoryResult] = await Promise.all([
      pool.request().query(districtQuery),
      pool.request().query(categoryQuery)
    ]);

    res.json({
      districts: districtResult.recordset,
      categories: categoryResult.recordset
    });
  } catch (err) {
    console.error("❌ Error in /new-applications/filters:", err.message);
    res.status(500).json({ error: "Error fetching filter options" });
  }
});

// 📊 Application action distribution with action names
router.get("/application-actions", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT fam.Longname AS action_name, COUNT(cs.Id) AS total
      FROM WBIPB.dbo.wbi_currentstatus cs
      INNER JOIN WBIPB.dbo.wbi_fileactionmaster fam ON cs.actionid = fam.Id
      GROUP BY fam.Longname
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error in /application-actions:", err.message);
    res.status(500).json({ error: "Error fetching application actions data" });
  }
});


// 📊 Pending vs. Approved Applications
router.get("/pending-approved-applications", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        CASE 
          WHEN Remarks LIKE '%pending%' THEN 'Pending' 
          ELSE 'Approved' 
        END AS application_status,
        COUNT(Id) AS total
      FROM WBIPB.dbo.wbi_currentstatus
      GROUP BY 
        CASE 
          WHEN Remarks LIKE '%pending%' THEN 'Pending' 
          ELSE 'Approved' 
        END
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error in /pending-approved-applications:", err.message);
    res.status(500).json({ error: "Error fetching pending vs. approved applications data" });
  }
});

router.get("/getApplicationsByDistrict", async (req, res) => {
  try {
    const { district, service_type, status, search, pending_stage } = req.query;

    const pool = await poolPromise;
    const request = pool.request()
      .input("district", district || null)
      .input("service_type", service_type || null)
      .input("status", status || null)
      .input("search", search ? `%${search}%` : null)
      .input("pending_stage", pending_stage || null);

    const query = `
      WITH CombinedApplications AS (
        SELECT 
          u.Id AS appid, 
          u.Ownername, 
          u.firmname, 
          'New Licenses' AS service_type, 
          u.unitLocationaddrdist AS district_id,
          CASE 
            WHEN cs.actionid = 112 THEN 'Approved'
            ELSE 'Pending'
          END AS application_status
        FROM WBIPB.dbo.wbi_unitreg u
        LEFT JOIN WBIPB.dbo.wbi_currentstatus cs ON u.Id = cs.appid
        UNION ALL
        SELECT 
          e.Id, 
          e.Ownername, 
          e.firmname, 
          'Renewal of Licenses', 
          e.AddrPermanentDistrict,
          CASE 
            WHEN cs.actionid = 750 THEN 'Approved'
            ELSE 'Pending'
          END
        FROM WBIPB.dbo.wbi_existingUnit e
        LEFT JOIN WBIPB.dbo.wbi_currentstatus cs ON e.Id = cs.appid
        UNION ALL
        SELECT 
          oc.Id, 
          oc.firmname AS Ownername, 
          oc.firmname, 
          'Ownership Change', 
          oc.UnitAddrDistrict,
          CASE 
            WHEN cs.actionid = 31 THEN 'Approved'
            ELSE 'Pending'
          END
        FROM WBIPB.dbo.wbi_UnitOwnershipChange oc
        LEFT JOIN WBIPB.dbo.wbi_currentstatus cs ON oc.Id = cs.appid
        UNION ALL
        SELECT 
          ur.Id, 
          ur.firmname AS Ownername, 
          ur.firmname, 
          'Unit Relocation', 
          ur.UnitAddrDistrict,
          CASE 
            WHEN cs.actionid = 28 THEN 'Approved'
            ELSE 'Pending'
          END
        FROM WBIPB.dbo.wbi_RelocationUnit ur
        LEFT JOIN WBIPB.dbo.wbi_currentstatus cs ON ur.Id = cs.appid
      )
      SELECT 
        ca.appid,
        ca.Ownername,
        ca.firmname,
        d.longname AS district,
        ca.service_type,
        cs.actionid,
        fam.Display AS pending_stage,
        ca.application_status
      FROM CombinedApplications ca
      JOIN WBIPB.dbo.wbi_districts d ON d.id = ca.district_id
      LEFT JOIN WBIPB.dbo.wbi_currentstatus cs ON ca.appid = cs.appid
      LEFT JOIN WBIPB.dbo.wbi_fileactionmaster fam ON cs.actionid = fam.Id
      WHERE (@district IS NULL OR LOWER(d.longname) = LOWER(@district))
        AND (@service_type IS NULL OR LOWER(ca.service_type) = LOWER(@service_type))
        AND (@status IS NULL OR ca.application_status = @status)
        AND (@pending_stage IS NULL OR fam.Display = @pending_stage)
        AND (@search IS NULL OR 
             (LOWER(ca.Ownername) LIKE LOWER(@search) OR LOWER(ca.firmname) LIKE LOWER(@search)))
      ORDER BY ca.service_type, ca.Ownername;
    `;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error in /getApplicationsByDistrict:", err.stack);
    res.status(500).json({ error: "Error fetching applications for district" });
  }
});


router.get("/getDashboardData", async (req, res) => {
  try {
    const { service_type, status, pending_stage } = req.query;

    const pool = await poolPromise;
    const request = pool.request()
      .input("service_type", service_type || null)
      .input("status", status || null)
      .input("pending_stage", pending_stage || null);

    const query = `
      SELECT 
          d.longname AS district,  
          combined_data.service_type,  
          COUNT(combined_data.appid) AS total_applications,  
          fam.Display AS action_status,  
          COUNT(CASE  
              WHEN (combined_data.service_type = 'New Licenses' AND cs.actionid = 112)  
                OR (combined_data.service_type = 'Unit Relocation' AND cs.actionid = 28)  
                OR (combined_data.service_type = 'Renewal of Licenses' AND cs.actionid = 750)  
                OR (combined_data.service_type = 'Ownership Change' AND cs.actionid = 31)  
              THEN combined_data.appid  
          END) AS approved_count,  
          COUNT(combined_data.appid) - COUNT(CASE  
              WHEN (combined_data.service_type = 'New Licenses' AND cs.actionid = 112)  
                OR (combined_data.service_type = 'Unit Relocation' AND cs.actionid = 28)  
                OR (combined_data.service_type = 'Renewal of Licenses' AND cs.actionid = 750)  
                OR (combined_data.service_type = 'Ownership Change' AND cs.actionid = 31)  
              THEN combined_data.appid  
          END) AS pending_count  
      FROM (  
          SELECT u.Id AS appid, 'New Licenses' AS service_type, u.unitLocationaddrdist AS district_id  
          FROM WBIPB.dbo.wbi_unitreg u  
          UNION ALL  
          SELECT e.Id AS appid, 'Renewal of Licenses' AS service_type, e.AddrPermanentDistrict AS district_id  
          FROM WBIPB.dbo.wbi_existingUnit e  
          UNION ALL  
          SELECT oc.Id AS appid, 'Ownership Change' AS service_type, oc.UnitAddrDistrict AS district_id  
          FROM WBIPB.dbo.wbi_UnitOwnershipChange oc  
          UNION ALL  
          SELECT ur.Id AS appid, 'Unit Relocation' AS service_type, ur.UnitAddrDistrict AS district_id  
          FROM WBIPB.dbo.wbi_RelocationUnit ur  
      ) AS combined_data  
      JOIN WBIPB.dbo.wbi_districts d ON d.id = combined_data.district_id  
      LEFT JOIN WBIPB.dbo.wbi_currentstatus cs ON combined_data.appid = cs.appid  
      LEFT JOIN WBIPB.dbo.wbi_fileactionmaster fam ON cs.actionid = fam.Id  
      WHERE (@service_type IS NULL OR combined_data.service_type = @service_type)
        AND (@pending_stage IS NULL OR fam.Display = @pending_stage)
        AND (
          @status IS NULL OR
          (
            (@status = 'Approved' AND (
              (combined_data.service_type = 'New Licenses' AND cs.actionid = 112) OR
              (combined_data.service_type = 'Unit Relocation' AND cs.actionid = 28) OR
              (combined_data.service_type = 'Renewal of Licenses' AND cs.actionid = 750) OR
              (combined_data.service_type = 'Ownership Change' AND cs.actionid = 31)
            )) OR
            (@status = 'Pending' AND NOT (
              (combined_data.service_type = 'New Licenses' AND cs.actionid = 112) OR
              (combined_data.service_type = 'Unit Relocation' AND cs.actionid = 28) OR
              (combined_data.service_type = 'Renewal of Licenses' AND cs.actionid = 750) OR
              (combined_data.service_type = 'Ownership Change' AND cs.actionid = 31)
            ))
          )
        )
      GROUP BY d.longname, combined_data.service_type, fam.Display  
      ORDER BY d.longname, combined_data.service_type, fam.Display;
    `;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error in /getDashboardData:", err.message);
    res.status(500).json({ error: "Error fetching dashboard data" });
  }
});
module.exports = router;