var taskData = {
	"data": [
	//{ "id": 25, "text": "sales order", "type": "project", "start_date": "02-04-2019 00:00", "duration": 17, "progress": 0.4, "owner_id": ["5"], "parent": 0 },
	//{ "id": 1, "text": "office itinerancy", "type": "project", "start_date": "02-04-2019 00:00", "duration": 17, "progress": 0.4,"owner_id": ["5"], "parent": 0},
	//{ "id": 2, "text": "office facing", "type": "project", "start_date": "02-04-2019 00:00", "duration": 8, "progress": 0.6,"owner_id": ["5"], "parent": "1"},
	//{ "id": 3, "text": "furniture installation", "type": "project", "start_date": "11-04-2019 00:00", "duration": 8, "parent": "1", "progress": 0.6, "owner_id": ["5"]},
	//{ "id": 4, "text": "the employee relocation", "type": "project", "start_date": "13-04-2019 00:00", "duration": 5, "parent": "1", "progress": 0.5,"owner_id": ["5"], "priority":3},
	//{ "id": 5, "text": "interior office", "type": "task", "start_date": "03-04-2019 00:00", "duration": 7, "parent": "2", "progress": 0.6,"owner_id": ["6"], "priority":1},
	//{ "id": 6, "text": "air conditioners check", "type": "task", "start_date": "03-04-2019 00:00", "duration": 7, "parent": "2", "progress": 0.6,"owner_id": ["7"], "priority":2},
	//{ "id": 7, "text": "workplaces preparation", "type": "task", "start_date": "12-04-2019 00:00", "duration": 8, "parent": "3", "progress": 0.6, "owner_id": ["10"]},
	//{ "id": 8, "text": "preparing workplaces", "type": "task", "start_date": "14-04-2019 00:00", "duration": 5, "parent": "4", "progress": 0.5, "owner_id": ["10","9"], "priority":1},
	//{ "id": 9, "text": "workplaces importation", "type": "task", "start_date": "21-04-2019 00:00", "duration": 4, "parent": "4", "progress": 0.5, "owner_id": ["7"]},
	//{ "id": 10, "text": "workplaces exportation", "type": "task", "start_date": "27-04-2019 00:00", "duration": 3, "parent": "4", "progress": 0.5,"owner_id": ["8"], "priority":2},
	//{ "id": 11, "text": "product launch", "type": "project", "progress": 0.6, "start_date": "02-04-2019 00:00", "duration": 13,"owner_id": ["5"], "parent": 0},
	//{ "id": 12, "text": "perform initial testing", "type": "task", "start_date": "03-04-2019 00:00", "duration": 5, "parent": "11", "progress": 1, "owner_id": ["7"]},
	//{ "id": 13, "text": "development", "type": "project", "start_date": "03-04-2019 00:00", "duration": 11, "parent": "11", "progress": 0.5, "owner_id": ["5"]},
	//{ "id": 14, "text": "analysis", "type": "task", "start_date": "03-04-2019 00:00", "duration": 6, "parent": "11", "progress": 0.8, "owner_id": ["5"]},
	//{ "id": 15, "text": "design", "type": "project", "start_date": "03-04-2019 00:00", "duration": 5, "parent": "11", "progress": 0.2, "owner_id": ["5"]},
	//{ "id": 16, "text": "documentation creation", "type": "task", "start_date": "03-04-2019 00:00", "duration": 7, "parent": "11", "progress": 0,"owner_id": ["7"], "priority":1},
	//{ "id": 17, "text": "develop system", "type": "task", "start_date": "03-04-2019 00:00", "duration": 2, "parent": "13", "progress": 1,"owner_id": ["8"], "priority":2},
	//{ "id": 25, "text": "beta release", "type": "milestone", "start_date": "06-04-2019 00:00", "parent": "13", "progress": 0,"owner_id": ["5"], "duration": 0},
	//{ "id": 18, "text": "integrate system", "type": "task", "start_date": "10-04-2019 00:00", "duration": 2, "parent": "13", "progress": 0.8,"owner_id": ["6"], "priority":3},
	//{ "id": 19, "text": "test", "type": "task", "start_date": "13-04-2019 00:00", "duration": 4, "parent": "13", "progress": 0.2, "owner_id": ["6"]},
	//{ "id": 20, "text": "marketing", "type": "task", "start_date": "13-04-2019 00:00", "duration": 4, "parent": "13", "progress": 0,"owner_id": ["8"], "priority":1},
	//{ "id": 21, "text": "design database", "type": "task", "start_date": "03-04-2019 00:00", "duration": 4, "parent": "15", "progress": 0.5, "owner_id": ["6"]},
	//{ "id": 22, "text": "software design", "type": "task", "start_date": "03-04-2019 00:00", "duration": 4, "parent": "15", "progress": 0.1,"owner_id": ["8"], "priority":1},
	//{ "id": 23, "text": "interface setup", "type": "task", "start_date": "03-04-2019 00:00", "duration": 5, "parent": "15", "progress": 0,"owner_id": ["8"], "priority":1},
	//{ "id": 24, "text": "release v1.0", "type": "milestone", "start_date": "20-04-2019 00:00", "parent": "11", "progress": 0, "owner_id": ["5"], "duration": 0 }
		{ "id": 25, "text": "Sales Order", "type": "project", "progress": 0, "start_date": "02-04-2019 00:00", "duration": 3, "owner_id": ["1"], "parent": 0 },
		{ "id": 26, "text": "Production Order", "type": "project", "progress": 0, "start_date": "02-04-2019 00:00", "duration": 3, "owner_id": ["1"], "parent": "25" },
		{ "id": 27, "text": "Route Stage", "type": "project", "progress": 0, "start_date": "03-04-2019 00:00", "duration": 1, "owner_id": ["1"], "parent": "26" },
		{ "id": 28, "text": "Res1", "type": "task", "start_date": "03-04-2019 00:00", "duration": 2, "parent": "27", "progress": 0, "owner_id": ["1"] },
		{ "id": 29, "text": "Res2", "type": "task", "start_date": "05-04-2019 00:00", "duration": 1, "parent": "27", "progress": 0, "owner_id": ["1"] },
		{ "id": 30, "text": "Route Stage 2", "type": "project", "progress": 0, "start_date": "06-04-2019 00:00", "duration": 1, "owner_id": ["1"], "parent": "26" },
		{ "id": 31, "text": "Res1", "type": "task", "start_date": "06-04-2019 00:00", "duration": 1, "parent": "30", "progress": 0, "owner_id": ["1"] },
		{
			id: 33, text: "Due Date", start_date: "08-04-2019", type: "milestone",
			rollup: true, hide_bar: true, parent: "25", progress: 0
		},

  ],
  "links": [
	  { "id": "1", "source": "28", "target": "29", "type": "0" },
	  { "id": "2", "source": "27", "target": "30", "type": "0" },

	//{ "id": "2", "source": "2", "target": "3", "type": "0" },
	//{ "id": "3", "source": "3", "target": "4", "type": "0" },
	//{ "id": "7", "source": "8", "target": "9", "type": "0" },
	//{ "id": "8", "source": "8", "target": "10", "type": "0" },
	//{ "id": "16", "source": "17", "target": "25", "type": "0" },
	//{ "id": "17", "source": "18", "target": "19", "type": "0" },
	//{ "id": "18", "source": "19", "target": "20", "type": "0" },
	//{ "id": "22", "source": "13", "target": "24", "type": "0" },
	//{ "id": "23", "source": "25", "target": "18", "type": "0" }

  ]
}