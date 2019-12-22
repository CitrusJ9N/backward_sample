//区間の定義
const Interval = function(s, a, b) {
	this.s = (s.length == 2) ? s : "[]"; //端点; [], (), [), (]のいずれか
	this.a = a;
	this.b = b;
	
	//端点の扱いの等価判定
	this.eq = function(t) {
		return this.s === t;
	};
	
	//加算の定義
	this.add = function(x) {
		return new Interval(this.s, this.a + x, this.b + x);
	};
	
	//乗算の定義
	this.mult = function(x) {
		const r = function() { //端点の扱いを反転する
			switch (this.s) {
			case "[]":
			case "()": return this.s;
			case "[)": return "(]";
			case "(]": return "[)";
			}
			return "[]";
		};
		return (x >= 0) ? new Interval(this.s, this.a * x, this.b * x) : new Interval(r(), this.b * x, this.a * x);
	};
	
	//整数区間に変換
	this.to_int = function() {
		//左端点の処理
		let a = this.a;
		switch (this.s[0]) {
		case "(":
			a = Math.floor(a + 1);
			break;
		case "[":
			a = Math.ceil(a);
			break;
		}

		//右端点の処理
		let b = this.b;
		switch (this.s[1]) {
		case ")":
			b = Math.ceil(b - 1);
			break;
		case "]":
			b = Math.floor(b);
		}
		
		//端点の扱いを変更
		const s = "[]";
		
		return new Interval(s, a, b);
	};
	
	//丸め処理の逆関数の定義
	this.inv_identity = function() { return this; };
	
	this.inv_floor = function()
	{
		const x = this.to_int();
		return new Interval("[)", x.a, x.b + 1);
	};
	
	this.inv_ceiling = function()
	{
		const x = this.to_int();
		return new Interval("(]", x.a - 1, x.b);
	};
	
	//逆関数を実行
	this.inv = function(name) {
		switch (name) {
		case "identity": return this.inv_identity();
		case "floor": return this.inv_floor();
		case "ceiling": return this.inv_ceiling();
		}
		return this.inv_identity();
	};
	
	//テスト用
	this.show = () => { console.log([this.s, this.a, this.b]); };
	
	return this;
};

const to_interval = function(v) {
	return new Interval(v[0], v[1], v[2]);
};


const interval_test = function() {
	const i = new Interval("[)", 1.41, 2.23);
	i.show();
	i.add(9).show();
	i.mult(10).show();
	i.mult(-10).show();
	i.to_int().show();
	i.inv().show();
	i.inv("floor").show();
	i.inv("ceiling").show();
};

const Rounding = function(name) {
	return (name == "floor") ? (t) => { return Math.floor(t); }
		: (name == "ceiling") ? (t) => { return Math.ceil(t); }
		: (t) => { return t; };
};


const main = function(a0, an, task, hypothesis) {
	//補正値がセットされていなければデフォルト値を入れて返す関数
	const to_valid = function(x) {
		const y = x;
		y["a"] = (y["a"] == undefined) ? 1.0 : y["a"];
		y["b"] = (y["b"] == undefined) ? 0.0 : y["b"];
		return y;
	};
	
	//(a, b)がセットされていなければデフォルト値を置く
	const v = task;
	v.forEach((x) => {
		x = to_valid(x);
	});
	
	//w:補正値の仮定 をhypothesisよりセット
	const w = v.map((x) => {
		const name = "after: " + x["name"];
		const t = (hypothesis[name] == undefined) ? {} : hypothesis[name];
		t["name"] = name;
		return to_valid(t);
	});
	
	//yの推定値を求める
	v.reduce((y, x, i) => {
		const f = Rounding(x["f"]);
		const z = f(y * x["a"] + x["b"]);
		w[i]["y"] = z;
		return z;
	}, a0);
	
	w.reduceRight((y, x, i) => {
		//補正値a, bを求める
		const z = y.inv(x["f"]);
		const a = x["a"];
		const b = x["b"];
		x["a"] = z.add(-b).mult(1 / x["y"]);
		x["b"] = z.add(-x["y"] * a);
		const inv_y = z.add(-b).mult(1 / a);
		
		//既定の補正についてyを逆算
		return inv_y.inv(v[i]["f"]).add(-v[i]["b"]).mult(1 / v[i]["a"]);
	}, to_interval(an));
	
	w.forEach((x) => {
		console.log(x);
		x["a"].show();
		x["b"].show();
	});
};
main(35.11, ["[)", 46, 68],
[
	{"name": "キャップ後陸上補正"},
	{"name": "陸上補正後の切り捨て", "f": "floor"},
	{"name": "徹甲弾補正"},
	{"name": "CL2", "a": 1.5, "b": 0.0, "f": "floor"}
],
{});
/* 結果
{name: "after: キャップ後陸上補正", a: Interval, b: Interval, y: 35.11}
 ["[)", 0.8829393335232127, 1.3101680432925091]
 ["[)", -4.109999999999999, 10.89]
{name: "after: 陸上補正後の切り捨て", a: Interval, b: Interval, y: 35}
 ["[)", 0.8761904761904761, 1.295238095238095]
 ["[)", -4.333333333333336, 10.333333333333329]
{name: "after: 徹甲弾補正", a: Interval, b: Interval, y: 35}
 ["[)", 0.8761904761904761, 1.295238095238095]
 ["[)", -4.333333333333336, 10.333333333333329]
{name: "after: CL2", a: Interval, b: Interval, y: 52}
 ["[)", 0.8846153846153847, 1.3076923076923077]
 ["[)", -6, 16]
*/