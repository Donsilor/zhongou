package main

import (
	"crypto/sha1"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math/rand"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
	"github.com/qiniu/log"
)

func checkErr(err error) {
	if err != nil {
		panic(err)
	}
}

var db *sql.DB

func init() {
	var err error
	db, err = sql.Open("sqlite3", "./database.db")
	checkErr(err)
	createTable := `
	create table if not exists register (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tjName VARCHAR(64) NULL,
	classRoom VARCHAR(32) NULL,
	name VARCHAR(64) NULL,
    title VARCHAR(64) NULL,
	phone VARCHAR(20) NULL,
	co VARCHAR(64) NULL,
    createAt VARCHAR(20) NULL
	);
	`
	_, err = db.Exec(createTable)
	checkErr(err)
}
func main() {
	r := gin.Default()
	r.Use(gin.Recovery())
	r.Use(static.Serve("/", static.LocalFile("./", true)))
	rootApi := r.Group("/api")
	rootApi.GET("ping", func(c *gin.Context) {
		c.String(200, "pong")
	})
	srv := Service{
		wx: WX{
			Appid:  "wx34cd993710628c13",
			Secret: "eede7d32677e4bdc923e71603978983d",
		},
		client: http.DefaultClient,
	}
	rootApi.GET("wx", srv.GetWxSign)
	rootApi.POST("registe", srv.PostRegister)
	rootApi.GET("stat", srv.GetStat)
	rootApi.GET("all", srv.GetAll)
	rootApi.GET("delete/all/done", srv.DeleteAll)

	r.Run(fmt.Sprintf("0.0.0.0:%d", 8090))

}

type WX struct {
	Appid  string `json:"appid"`
	Secret string `json:"secret"`
}

type Service struct {
	wx     WX
	client *http.Client
}

type Register struct {
	TjName    string `json:"tjName"`    //推荐人
	ClassRoom string `json:"classRoom"` //所属班级
	Name      string `json:"name"`      //姓名
	Title     string `json:"title"`     //职位
	Phone     string `json:"phone"`     //电话
	Co        string `json:"co"`        //所在公司
	CreateAt  string `json:"createAt"`  //时间
}

func (m *Service) PostRegister(c *gin.Context) {
	var req Register
	err := c.BindJSON(&req)
	if err != nil {
		c.JSON(400, gin.H{"message": fmt.Sprintf("参数有误 %v", err)})
		return
	} else {
		if req.Name != "" {
			insertSql := fmt.Sprintf("INSERT INTO register(tjName, classRoom, name, title, phone,co, createAt) values('%s','%s','%s','%s','%s','%s','%s')",
				req.TjName, req.ClassRoom, req.Name, req.Title, req.Phone, req.Co, time.Now().Format("2006-01-02 15:04:05"))
			fmt.Println(insertSql)
			_, err := db.Exec(insertSql)
			if err != nil {
				c.JSON(400, gin.H{"message": fmt.Sprintf("保存错误 %v", err)})
				return
			}
		}
		c.JSON(200, req)
	}
}

func (m *Service) DeleteAll(c *gin.Context) {
	sql := fmt.Sprintf("DELETE FROM register")
	fmt.Println(sql)
	_, err := db.Exec(sql)
	if err != nil {
		c.JSON(400, gin.H{"message": fmt.Sprintf("错误 %v", err)})
		return
	}
	c.JSON(200, gin.H{"message": "全删了，无法恢复了"})
}

func (m *Service) GetAll(c *gin.Context) {
	res := make([]map[string]interface{}, 0)
	selectSQL := fmt.Sprintf(`
		select tjName,classRoom,name,title,phone,createAt from register order by createAt DESC;
		`)
	rows, err := db.Query(selectSQL)
	if err != nil {
		c.JSON(400, gin.H{"message": fmt.Sprintf("错误 %v", err)})
		return
	}
	defer rows.Close()
	for rows.Next() {
		tmp := make(map[string]interface{})
		var tjName string
		var classRoom string
		var name string
		var title string
		var phone string
		var createAt string
		err = rows.Scan(&tjName, &classRoom, &name, &title, &phone, &createAt)
		if err != nil {
			fmt.Println(err)
		}
		tmp["tjName"] = tjName
		tmp["classRoom"] = classRoom
		tmp["name"] = name
		tmp["title"] = title
		tmp["phone"] = phone
		tmp["createAt"] = createAt

		res = append(res, tmp)
	}
	c.JSON(200, res)
}

func (m *Service) GetStat(c *gin.Context) {
	_type := c.DefaultQuery("type", "1")
	res := make([]map[string]interface{}, 0)
	if _type == "1" || _type == "" {
		selectSQL := fmt.Sprintf(`
		select classRoom, count(classRoom) as amount from register group by classRoom order by amount DESC limit 3;
		`)
		rows, err := db.Query(selectSQL)
		if err != nil {
			c.JSON(400, gin.H{"message": fmt.Sprintf("错误 %v", err)})
			return
		}
		defer rows.Close()
		for rows.Next() {
			tmp := make(map[string]interface{})
			var classRoom string
			var amount int64
			err = rows.Scan(&classRoom, &amount)
			if err != nil {
				fmt.Println(err)
			}
			tmp["key"] = classRoom
			tmp["value"] = amount
			res = append(res, tmp)
			fmt.Println(classRoom, amount)
		}
	} else {
		selectSQL := fmt.Sprintf(`
		select tjName, count(tjName) as amount from register group by tjName order by amount DESC limit 3;
		`)
		rows, err := db.Query(selectSQL)
		if err != nil {
			c.JSON(400, gin.H{"message": fmt.Sprintf("错误 %v", err)})
			return
		}
		defer rows.Close()
		for rows.Next() {
			tmp := make(map[string]interface{})
			var tjName string
			var amount int64
			err = rows.Scan(&tjName, &amount)
			if err != nil {
				fmt.Println(err)
			}
			tmp["key"] = tjName
			tmp["value"] = amount
			res = append(res, tmp)
			fmt.Println(tjName, amount)
		}
	}

	c.JSON(200, res)
}

type Signature struct {
	AppId     string `json:"appId"`
	Timestamp int64  `json:"timestamp"`
	NonceStr  string `json:"nonceStr"`
	Signature string `json:"signature"`
}

type TicketCache struct {
	AccessToken string    `json:"accessToken"`
	JSApiTicket string    `json:"jsapiTicket"`
	Expires     float64   `json:"expires"`
	Time        time.Time `json:"time"`
}

var ticketCache = TicketCache{"", "", 7200, time.Now()}

func (m *Service) GetWxSign(c *gin.Context) {
	url := c.Query("url")
	if url == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "URL不能为空"})
		return
	}
	var err error
	//log.Debug("=======", url, strings.Index(url, "#"))
	if strings.Index(url, "#") > 0 {
		url = url[0 : strings.Index(url, "#")+1]
	}
	//log.Debug(url)
	signature := Signature{}
	signature.AppId = m.wx.Appid
	signature.Timestamp = time.Now().Unix()
	signature.NonceStr = GenNonceStr()

	signMap := make(map[string]interface{})
	signMap["timestamp"] = signature.Timestamp
	signMap["noncestr"] = signature.NonceStr
	signMap["url"] = url
	signMap["jsapi_ticket"], err = m.getJsapiTicket()
	if err != nil {
		fmt.Errorf("获取微信JSAPI Ticket失败：%v", err)
		c.JSON(http.StatusForbidden, gin.H{"message": "获取微信JSAPI Ticket失败"})
		return
	}
	//log.Debugf("%#v", signMap)
	signature.Signature = wxSign(signMap)
	c.JSON(http.StatusOK, signature)
}

type JSApiTicket struct {
	ErrCode   int    `json:"errcode"`
	ErrMsg    string `json:"errmsg"`
	Ticket    string `json:"ticket"`
	ExpiresIn int    `json:"expires_in"`
}

func (m *Service) getJsapiTicket() (jsapiTicket string, err error) {
	//log.Debug(ticketCache.AccessToken != "" && ticketCache.JSApiTicket != "")
	//log.Debug(ticketCache.Expires, ",", time.Now().Sub(ticketCache.Time).Seconds(), "===", ticketCache.Expires > time.Now().Sub(ticketCache.Time).Seconds())

	if ticketCache.AccessToken != "" && ticketCache.JSApiTicket != "" && ticketCache.Expires > time.Now().Sub(ticketCache.Time).Seconds() {
		return ticketCache.JSApiTicket, nil
	}
	accessToken, err := m.getAccessToken()
	if err != nil {
		fmt.Errorf("获取微信Access Token失败：%v", err)
	}
	getticket_url := fmt.Sprintf("https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=%s&type=jsapi", accessToken)
	fmt.Println(getticket_url)
	resp, err := m.client.Get(getticket_url)
	if err != nil {
		log.Error(err)
		return
	}

	if resp != nil {
		defer resp.Body.Close()
	}
	rb1, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		fmt.Errorf("Error: %v \nBody: %v", err, string(rb1))
		return
	}

	var ticket JSApiTicket
	err = json.Unmarshal(rb1, &ticket)
	if err != nil {
		log.Error(err)
		return
	}
	if ticket.ErrCode != 0 {
		log.Errorf("%#v", ticket)
		err = fmt.Errorf(ticket.ErrMsg)
		return
	}
	ticketCache.JSApiTicket = ticket.Ticket
	ticketCache.Time = time.Now()
	jsapiTicket = ticket.Ticket
	return
}

type AccessToken struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
}

func (m *Service) getAccessToken() (accessToken string, err error) {
	access_token_url := fmt.Sprintf("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s", m.wx.Appid, m.wx.Secret)
	resp, err := m.client.Get(access_token_url)
	if err != nil {
		log.Error(err)
		return
	}

	if resp != nil {
		defer resp.Body.Close()
	}
	rb1, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Errorf("Error: %v \nBody: %s", err, string(rb1))
		return
	}
	var at AccessToken
	err = json.Unmarshal(rb1, &at)
	if err != nil {
		log.Error(err)
		return
	}
	ticketCache.AccessToken = at.AccessToken
	accessToken = at.AccessToken
	//log.Debug("==accessToken=", accessToken)
	//leftTime = urlResp['expires_in']
	return
}

//微信jsapi 签名
func wxSign(mReq map[string]interface{}) string {
	//STEP 1, 对key进行升序排序.
	sorted_keys := make([]string, 0)
	for k, _ := range mReq {
		sorted_keys = append(sorted_keys, k)
	}

	sort.Strings(sorted_keys)
	//STEP2, 对key=value的键值对用&连接起来
	kvArr := make([]string, len(sorted_keys))
	for i, k := range sorted_keys {
		kvStr := fmt.Sprintf("%s=%v", strings.ToLower(k), mReq[k])
		kvArr[i] = kvStr
	}

	signStrings := strings.Join(kvArr, "&")

	sha1Ctx := sha1.New()
	sha1Ctx.Write([]byte(signStrings))
	cipherStr := sha1Ctx.Sum(nil)
	upperSign := hex.EncodeToString(cipherStr)

	return upperSign
}

func GenNonceStr() string {
	return fmt.Sprintf("NONCESTR%s%s", GetCurrTimeByCustomFormat("20060102150405"), GetRandomString(10))
}

//生成随机字符串
func GetRandomString(l int) string {
	str := "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	bytes := []byte(str)
	result := make([]byte, l)
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	for i := 0; i < l; i++ {
		result[i] = bytes[r.Intn(len(bytes))]
	}
	return string(result)
}

func GetMineTypeFromBase64Image(src string) string {
	splits := strings.Split(src, ",")
	if len(splits) == 2 {
		mineStr := splits[0]
		return strings.Trim(strings.Split(mineStr, ";")[0], "data:")
	}
	return ""
}

func GetCurrTimeByCustomFormat(timeLayout string) string {
	return time.Now().Format(timeLayout)
}
