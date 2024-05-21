import { Context } from "koishi";
export const inject = ["database"];

export const name = "database-example";

/* 一个简单的自建数据库示例 */
/**
 * 请以官方文档
 * https://koishi.chat/zh-CN/guide/database/model.html
 * 为准
 *
 * 本示例使用的数据库插件为 database-sqlite 4.2.0
 */

/* 第一个示例 */

//必需 请根据自己建立的表进行调整
declare module "koishi" {
  interface Tables {
    exampleDB: ExampleDB;
  }
}
//必需 声明要建立的表的类型
export interface ExampleDB {
  id: number;
  name: string;
}

export function apply(ctx: Context) {
  ctx.command("数据库");

  /**
   * 在建立后你可以在命令行看到一个形如 auto creating table exampleDB 的建立成功的提示，
   * 并在控制台的“数据库”页面可以看到新建的数据库。
   * 当已经存在同名的数据库时不会有提示
   *
   * 必须在数据库中建立表才能进行后续的数据库操作
   */
  ctx.command("数据库.建立表").action(async () => {
    ctx.database.extend("exampleDB", {
        id: "unsigned", //这里的类型和js的基本类型有一定区别，参见 https://koishi.chat/zh-CN/api/database/model.html#%E6%95%B0%E6%8D%AE%E7%B1%BB%E5%9E%8B
        name: "string",
      }, {
        primary: "id", //主键可以保证该条数据不会出现重复，在以用户为单位储存数据时可以以uid作为主键
      }
    )
  });

  // 在 database-sqlite 4.2 中这个数据库操作在数据库页面没有看到结果，但的确已经删除成功，无法再进行数据库操作
  // 请注意在已有数据的情况下不要轻易drop避免数据丢失，可以查看官方文档了解数据迁移的方法
  ctx.command("数据库.删除表").action(async () => {
    await ctx.database.drop("exampleDB");
  });
  // 插入数据
  // 下面给出四个database.create的示例
  // 因为主键的唯一性，重复插入含有相同主键的数据会失败
  // 插入的数据可以在控制台的“数据库”页面刷新查看
  // 想要覆盖数据可以使用upsert方法
  ctx.command("数据库.插入数据1").action(async () => {
    await ctx.database.create("exampleDB", { id: 0, name: "王二" });
  });

  ctx.command("数据库.插入数据2").action(async () => {
    const id = 1;
    const name = "张三";
    await ctx.database.create("exampleDB", { id, name });
  });

  ctx.command("数据库.插入数据3").action(async () => {
    const userData: ExampleDB = {
      id: 2,
      name: "李四",
    };
    await ctx.database.create("exampleDB", userData);
  });

  ctx.command("数据库.插入数据4").action(async () => {
    class User {
      id: number;
      name: string;
      constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
      }
    }
    const user = new User(3, "刘五");
    //由于typescript的类型检查使用了“鸭子类型”的机制，所以内容相同的类型会被视为相同类型
    await ctx.database.create("exampleDB", user);
  });

  // 查询数据
  /**
   * 下面给出 database.get 的示例
   * 注意 database.get 始终返回一个数组
   * 也请注意js中空数组的布尔值是true，想要判断没有满足条件的数据时可以使用array.length
   */
  ctx.command("数据库.查询数据1").action(async () => {
    const data = await ctx.database.get("exampleDB", { id: 0 });
    if (data.length !== 0) {
      console.log(data); // [{ id: 0, name: "王二" }]
    } else {
      console.log("没有找到数据");
    }
  });

  ctx.command("数据库.查询数据2").action(async () => {
    //想要获取数据表的全部数据，可以在get的第二个参数传入一个空对象
    const data = await ctx.database.get("exampleDB", {});
    console.log(data); //一个含有全部数据的数组
  });

  ctx.command("数据库.查询数据3").action(async () => {
    // 在只需要get的单个数据时可以用括号把await的部分包起来再取第一个数组元素
    const data = (await ctx.database.get("exampleDB", { id: 0 }))[0];
    console.log(data.id, data.name);
  })

  // 更新数据
  // 注意第二个参数和get方法的二参相同是一个查询条件
  // 所有满足条件的数据都会被修改
  ctx.command("数据库.更新数据").action(async () => {
    await ctx.database.set("exampleDB", { id: 0 }, { name: "王二狗" });
  });

  // 删除数据
  // 满足条件的数据都会被删除，但是与前面的方法不同的是，第二个参数传入空数组并不会删除全部内容
  ctx.command("数据库.删除数据").action(async () => {
    await ctx.database.remove("exampleDB", { id: 0 });
  })

  // 更新或插入数据
  /**
   * 如果数据存在则更新，不存在则create
   * 但是请注意，upsert的参数是一个数组，可以用于批量添加修改数据
   */
  ctx.command("数据库.更新插入数据1").action(async () => {
    await ctx.database.upsert("exampleDB", [{ id: 1 }, { name: "张三狗" }]);
  })

  ctx.command("数据库.更新插入数据2").action(async () => {
    const data: ExampleDB[] = [
      { id: 1, name: "张三鸡" },
      { id: 2, name: "李四狗" },
      { id: 3, name: "刘五狗" }
    ]
  })

}

//============================================================================//

/* 第二个示例 */

// declare module "koishi" {
//   interface Tables {
//     exampleDB2: ExampleDB2;
//     exampleDB3: ExampleDB3;
//   }
// }
// export interface ExampleDB2 {
//   guildid: string;
//   userid: string;
//   name: string;
//   age: number;
// }

// export interface ExampleDB3 {
//   id: number;
//   type: "早饭" | "午饭" | "晚饭";
//   name: string;
//   price?: number; //可选属性
// }

// export function apply(ctx: Context) {
//   ctx.database.extend("exampleDB2", {
//     guildid: "string",
//     userid: "string",
//     name: "string",
//     age: "unsigned",
//   }, {
//     primary: ["guildid","userid"],  //主键可以使用一个数组，这样可以实现"每个群的每个用户都是独立的数据"
//   })

//   ctx.database.extend("exampleDB3", {
//     id: "unsigned",
//     type: { type: "string", nullable: false }, // 对数据进行更详细的约束，参见 https://koishi.chat/zh-CN/guide/database/model.html#%E6%95%B0%E6%8D%AE%E7%B1%BB%E5%9E%8B
//     name: "string",
//     price: "unsigned",
//   } ,{
//     primary: "id",
//     autoInc: true, //让主键值自增，参见 https://koishi.chat/zh-CN/guide/database/model.html#%E5%A3%B0%E6%98%8E%E7%B4%A2%E5%BC%95
//     unique: [["type", "name"]]  //想要让 数据对 唯一时请使用这样的格式
//   })

//   ctx.on('ready', async () => {
//     const expmapledata: ExampleDB2[] = [
//       {
//         guildid: "123456789",
//         userid: "123456789",
//         name: "张三",
//         age: 18,
//       }, {
//         guildid: "123456789",
//         userid: "987654321",
//         name: "李四",
//         age: 19,
//       }
//     ];
//     await ctx.database.upsert("exampleDB2", expmapledata);
    
//     //因为主键自增 create 时可以忽略主键
//     await ctx.database.create("exampleDB3", { type: "早饭", name: "面包", price: 5 });
//     await ctx.database.create("exampleDB3", { type: "午饭", name: "黄焖鸡米饭" , price: 15});
//     await ctx.database.create("exampleDB3", { type: "午饭", name: "沙县小吃" , price: 16});
//     await ctx.database.create("exampleDB3", { type: "晚饭", name: "黄焖鸡米饭" , price: 15});
//   })

//   ctx.command("数据库.查询数据1").action(async () => {
//     const data = await ctx.database.get("exampleDB2", { guildid: "123456789" });
//     console.log(data);
//   })

//   ctx.command("数据库.查询数据2").action(async () => {
//     const data = await ctx.database.get("exampleDB3", { type: "午饭" });
//     console.log(data);
//   })
// }