// const mysql = require("mysql");
// const util = require("util");
// const log = require("../config/log4js");

// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   multipleStatements: true,
//   charset: "utf8mb4",
//   // typeCast: function castField( field, useDefaultTypeCasting ) {
//   // 	if ( ( field.type === "TINY" ) && ( field.length === 4 ) ) {
//   // 		var bytes = field.buffer();
//   // 		return( bytes[ 0 ] === 49);
//   // 	}
//   // 	return( useDefaultTypeCasting() );
//   // }
// });
// pool.query = util.promisify(pool.query).bind(pool);

// pool.getConnection(function (err) {
//   if (err) {
//     log.info("error connecting: " + err.stack);
//     console.log("error connecting: " + err.stack);
//     return;
//   }
//   log.info(`🚀 Connected to MySQL Server!`);
//   console.log("Connected to MySQL Server!");
// });

// module.exports = {
//   pool,
//   TBL_CREATOR_LOGS: "ops_creator_logs",
//   TBL_HOT_NFTS: "ops_hot_nfts",
//   TBL_HOT_ACTIVITIES: "ops_user_activities",
// };
