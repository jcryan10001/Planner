Settings

@OCHAPPCFG:WPPDefaultPermission

Set to None, Read Only or Full - this will be the default access for all users.

OUSR.U_WPPPermission

Set to Default, None, Read Only or Full - this will set access for specific user.

OWOR.U_WPPSaved

Y when Work Order was previously saved by the board.

When Y:		Loads tasks setup from WOR1.U_WPPSetup (fixed daily allocations + links).
Otherwise:	Links items sequentially top to bottom, Performs initial ForwardPlan for tasks.

OWOR.U_WPPSetup

JSON data informing the Gantt/Resource layout (fixed daily allocations + links).

	{
		"links": [
			{ "id": <id string>, "source": <source id>, "target": <target id>, "type": string },
			...
		],
		"planning": "exact"|"mean",
		"allocations": [
			{ "date": <date>, "hours": <number> },
			...
		],
		"totalallocaton": <int>
	}

	Note: When planning is "exact" and "totalallocation" <> "duration" - an error condition
	will be displayed both onscreen and prior to save.

Preferences
System saves the following preferences in the OCH_USERPREFS table:

WebProdPlan/Gantt  {User}.GroupBy
WebProdPlan/Gantt  {User}.Filter
WebProdPlan/Gantt  {User}.Criteria.postatus
